import { Injectable, Logger } from '@nestjs/common';

export type FournisseurIA = 'openrouter' | 'gemini' | 'mistral' | 'grok' | 'groq'; // NOUVEAU : 'groq' ajouté

export type ReponseIA = { content: string | null; tool_calls?: any[] };

@Injectable()
export class IaProviderService {
  private readonly logger = new Logger(IaProviderService.name);

  // --- Groq (NOUVEAU fournisseur) ---
  private readonly MODELES_GROQ_TEXTE = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3-32b'];
  private readonly MODELES_GROQ_VISION = ['llama-3.2-90b-vision-preview', 'llama-3.2-11b-vision-preview'];

  // --- OpenRouter (listes mises à jour) ---
  private readonly MODELES_OPENROUTER_TEXTE = [
    'nvidia/nemotron-3-ultra-550b-a55b:free', 'google/gemma-4-31b-it:free', 'cohere/north-mini-code:free',
    'openai/gpt-oss-20b:free', 'qwen/qwen-2.5-72b-instruct:free', 'meta-llama/llama-3.3-70b-instruct:free',
  ];
  private readonly MODELES_OPENROUTER_VISION = [
    'google/gemma-4-31b-it:free', 'meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen-2.5-72b-instruct:free',
  ];

  // --- Mistral (texte ET vision, séparés désormais) ---
  private readonly MODELES_MISTRAL_TEXTE = ['mistral-small-latest', 'open-mistral-nemo'];
  private readonly MODELES_MISTRAL_VISION = ['pixtral-12b-2409']; // NOUVEAU : Pixtral pour la vision

  private readonly ORDRE_FOURNISSEURS: FournisseurIA[] = ['gemini', 'groq', 'grok', 'mistral', 'openrouter'];

  async appelerAvecFallback(messages: any[], outils: any[] | null, aDesImages = false): Promise<ReponseIA> {
    let derniereErreur: Error | null = null;
    for (const fournisseur of this.ORDRE_FOURNISSEURS) {
      try {
        return await this.appeler(fournisseur, messages, outils, aDesImages);
      } catch (e: any) {
        derniereErreur = e instanceof Error ? e : new Error(String(e));
        this.logger.warn(`Fournisseur ${fournisseur} entièrement en échec : ${derniereErreur.message} — fournisseur suivant`);
      }
    }
    throw new Error(`Tous les fournisseurs IA ont échoué. Dernière erreur : ${derniereErreur?.message}`);
  }

  async appeler(fournisseur: FournisseurIA, messages: any[], outils: any[] | null = null, aDesImages = false): Promise<ReponseIA> {
    switch (fournisseur) {
      case 'openrouter': return this.appelerListeModeles('https://openrouter.ai/api/v1/chat/completions', process.env.OPENROUTER_API_KEY, 'OPENROUTER_API_KEY', aDesImages ? this.MODELES_OPENROUTER_VISION : this.MODELES_OPENROUTER_TEXTE, messages, outils, 'OpenRouter');
      case 'groq': return this.appelerListeModeles('https://api.groq.com/openai/v1/chat/completions', process.env.GROQ_API_KEY, 'GROQ_API_KEY', aDesImages ? this.MODELES_GROQ_VISION : this.MODELES_GROQ_TEXTE, messages, outils, 'Groq');
      case 'mistral': return this.appelerListeModeles('https://api.mistral.ai/v1/chat/completions', process.env.MISTRAL_API_KEY, 'MISTRAL_API_KEY', aDesImages ? this.MODELES_MISTRAL_VISION : this.MODELES_MISTRAL_TEXTE, messages, outils, 'Mistral');
      case 'grok': return this.appelerGrok(messages, outils);
      case 'gemini': return this.appelerGemini(messages, outils);
      default: throw new Error(`Fournisseur IA inconnu : ${fournisseur}`);
    }
  }

  // Générique : tous les fournisseurs OpenAI-compatibles (OpenRouter, Groq, Mistral) partagent cette logique
  private async appelerListeModeles(url: string, apiKey: string | undefined, nomVar: string, modeles: string[], messages: any[], outils: any[] | null, nomFournisseur: string): Promise<ReponseIA> {
    if (!apiKey) throw new Error(`${nomVar} manquante dans le fichier .env`);
    let derniereErreur: Error | null = null;

    for (const modele of modeles) {
      try {
        this.logger.log(`Tentative ${nomFournisseur} avec ${modele}`);
        const reponse = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: modele, messages, ...(outils ? { tools: outils, tool_choice: 'auto' } : {}) }),
        });
        const donnees = await reponse.json();
        if (!reponse.ok || !donnees.choices) throw new Error(donnees.error?.message || `Erreur ${nomFournisseur} (${reponse.status})`);
        const message = donnees.choices[0].message;
        this.logger.log(`Réponse obtenue via ${nomFournisseur}/${modele}`);
        return { content: message.content ?? null, tool_calls: message.tool_calls ?? [] };
      } catch (erreur: any) {
        derniereErreur = erreur instanceof Error ? erreur : new Error(String(erreur));
        this.logger.warn(`Échec ${nomFournisseur}/${modele} : ${derniereErreur.message}`);
      }
    }
    throw new Error(`Tous les modèles ${nomFournisseur} ont échoué. Dernière erreur : ${derniereErreur?.message}`);
  }

  private async appelerGrok(messages: any[], outils: any[] | null): Promise<ReponseIA> {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) throw new Error('GROK_API_KEY manquante dans le fichier .env');
    const modele = process.env.GROK_MODEL || 'grok-4-fast';
    this.logger.log(`Tentative Grok avec ${modele}`);
    const reponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modele, messages, ...(outils ? { tools: outils, tool_choice: 'auto' } : {}) }),
    });
    const donnees = await reponse.json();
    if (!reponse.ok || !donnees.choices) throw new Error(donnees.error?.message || `Erreur Grok (${reponse.status})`);
    const message = donnees.choices[0].message;
    this.logger.log(`Réponse obtenue via Grok/${modele}`);
    return { content: message.content ?? null, tool_calls: message.tool_calls ?? [] };
  }

  // Gemini : garde EXACTEMENT ta version corrigée (doc 53) — thoughtSignature, conversion outils,
  // téléchargement d'image en base64, functionResponse au format objet — tout ça est déjà bon, ne change rien.
  private async telechargerImageEnBase64(url: string): Promise<{ mimeType: string; data: string }> {
    const reponse = await fetch(url);
    if (!reponse.ok) throw new Error(`Impossible de télécharger l'image : ${url}`);
    const buffer = Buffer.from(await reponse.arrayBuffer());
    const mimeType = reponse.headers.get('content-type') || 'image/jpeg';
    return { mimeType, data: buffer.toString('base64') };
  }

  private convertirOutilsPourGemini(outils: any[] | null) {
    if (!outils || outils.length === 0) return undefined;
    const declarations = outils.map((o: any) => {
      const fn = o.function ?? o;
      if (!fn?.name) return null;
      return { name: fn.name, description: fn.description ?? '', parameters: fn.parameters ?? { type: 'object', properties: {} } };
    }).filter(Boolean);
    return declarations.length === 0 ? undefined : [{ function_declarations: declarations }];
  }

  private async convertirMessagesPourGemini(messages: any[]) {
    let systemInstruction: any = null;
    const contents: any[] = [];
    for (const m of messages) {
      if (m.role === 'system') {
        systemInstruction = { parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }] };
        continue;
      }
      if (m.role === 'user') {
        const parts: any[] = [];
        if (Array.isArray(m.content)) {
          for (const bloc of m.content) {
            if (bloc.type === 'image_url') {
              const imageUrl = bloc.image_url?.url;
              if (!imageUrl) continue;
              const { mimeType, data } = await this.telechargerImageEnBase64(imageUrl);
              parts.push({ inlineData: { mimeType, data } });
              continue;
            }
            parts.push({ text: bloc.text ?? '' });
          }
        } else {
          parts.push({ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) });
        }
        if (parts.length > 0) contents.push({ role: 'user', parts });
        continue;
      }
      if (m.role === 'assistant') {
        const parts: any[] = [];
        if (m.content) parts.push({ text: m.content });
        if (Array.isArray(m.tool_calls)) {
          for (const tc of m.tool_calls) {
            let args: any = {};
            try { args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments ?? {}; } catch { args = {}; }
            parts.push({ functionCall: { name: tc.function.name, args, ...(tc.id ? { id: tc.id } : {}) }, ...(tc.thoughtSignature ? { thoughtSignature: tc.thoughtSignature } : {}) });
          }
        }
        if (parts.length > 0) contents.push({ role: 'model', parts });
        continue;
      }
      if (m.role === 'tool') {
        let resultat: any;
        try { resultat = typeof m.content === 'string' ? JSON.parse(m.content) : m.content; } catch { resultat = { result: m.content }; }
        contents.push({ role: 'user', parts: [{ functionResponse: { name: m.name || 'proposerModification', response: { result: resultat }, ...(m.tool_call_id ? { id: m.tool_call_id } : {}) } }] });
      }
    }
    return { systemInstruction, contents };
  }

  private async appelerGemini(messages: any[], outils: any[] | null): Promise<ReponseIA> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY manquante dans le fichier .env');
    const modele = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const { systemInstruction, contents } = await this.convertirMessagesPourGemini(messages);
    const tools = this.convertirOutilsPourGemini(outils);

    this.logger.log(`Tentative Gemini avec ${modele}`);
    const reponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ ...(systemInstruction ? { system_instruction: systemInstruction } : {}), contents, ...(tools ? { tools } : {}) }),
    });
    const donnees = await reponse.json();
    if (!reponse.ok || !donnees.candidates?.length) throw new Error(donnees.error?.message || `Erreur Gemini (${reponse.status})`);

    const parts = donnees.candidates[0].content?.parts ?? [];
    const texte = parts.filter((p: any) => p.text).map((p: any) => p.text).join('\n') || null;
    const tool_calls = parts.filter((p: any) => p.functionCall).map((p: any, i: number) => ({
      id: `gemini-call-${i}`, type: 'function',
      function: { name: p.functionCall.name, arguments: JSON.stringify(p.functionCall.args ?? {}) },
      ...(p.thoughtSignature ? { thoughtSignature: p.thoughtSignature } : {}),
    }));
    this.logger.log(`Réponse obtenue via Gemini/${modele}`);
    return { content: texte, tool_calls };
  }
}