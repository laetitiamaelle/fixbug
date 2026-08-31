// ia-provider.service.ts — fichier complet (corrigé)
import { Injectable, Logger } from '@nestjs/common';

export type FournisseurIA = 'openrouter' | 'gemini' | 'mistral' | 'grok';

export type ReponseIA = {
    content: string | null;
    tool_calls?: any[];
};

@Injectable()
export class IaProviderService {
    private readonly logger = new Logger(IaProviderService.name);

    // CORRECTIF : liste vision — modèles gratuits confirmés multimodaux + tool calling.
    // gemma-4-31b retiré (plus fiable dans vos tests précédents), poolside/laguna-s-2.1
    // retiré (ne supporte pas l'image, cf. erreur "No endpoints found that support image input").
    private readonly MODELES_OPENROUTER_VISION = [
        'minimax/minimax-m3:free',                         // multimodal (texte/image/vidéo), agentique, tool use, 1M contexte
        'thinkingmachines/inkling:free',                    // multimodal, agentique, tool use
        'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', // multimodal (image/vidéo/audio), 256K contexte
    ];

    // CORRECTIF : liste texte — openai/gpt-oss-120b:free retiré (slug obsolète, devenu payant),
    // nvidia/nemotron-3-ultra:free corrigé en nvidia/nemotron-3-ultra-550b-a55b:free (slug exact).
    private readonly MODELES_OPENROUTER_TEXTE = [
        'nvidia/nemotron-3-ultra-550b-a55b:free',  // 1M contexte, orchestration d'agents, coding
        'cohere/north-mini-code:free',             // dédié codage agentique, tool use via JSON schema, léger/rapide
        'z-ai/glm-5.2:free',                       // 1M contexte, workflows d'agents longs, ingénierie logicielle
        'poolside/laguna-xs-2.1:free',             // léger, tool calling, coding agentique
    ];

    // Ordre des FOURNISSEURS essayés en cascade — Gemini/Grok/Mistral d'abord (plus fiables
    // sur tes tests), OpenRouter en dernier filet avec son propre repli interne de modèles.
    private readonly ORDRE_FOURNISSEURS: FournisseurIA[] = ['gemini', 'grok', 'mistral', 'openrouter'];

private async telechargerImageEnBase64(url: string): Promise<{ mimeType: string; data: string }> {
    const reponse = await fetch(url);
    if (!reponse.ok) throw new Error(`Impossible de télécharger l'image : ${url}`);
    const buffer = Buffer.from(await reponse.arrayBuffer());
    const mimeType = reponse.headers.get('content-type') || 'image/jpeg';
    return { mimeType, data: buffer.toString('base64') };
}

  // CORRECTIF : nouvelle fonction — convertit le format OpenAI des outils (outils[].function)
  // vers le format Gemini (function_declarations). Sans ça, Gemini ne reçoit AUCUN schéma
  // d'outil et improvise ses appels de fonction à partir du seul historique, ce qui casse
  // le tool calling et génère les erreurs de thought_signature.
  private convertirOutilsPourGemini(outils: any[] | null) {
      if (!outils || outils.length === 0) return undefined;

      const declarations = outils
          .map((o: any) => {
              const fn = o.function ?? o;
              if (!fn?.name) return null;
              return {
                  name: fn.name,
                  description: fn.description ?? '',
                  parameters: fn.parameters ?? { type: 'object', properties: {} },
              };
          })
          .filter(Boolean);

      if (declarations.length === 0) return undefined;

      return [{ function_declarations: declarations }];
  }

  private async convertirMessagesPourGemini(messages: any[]) {
    let systemInstruction: any = null;
    const contents: any[] = [];

    for (const m of messages) {

        // SYSTEM
        if (m.role === 'system') {
            systemInstruction = {
                parts: [
                    {
                        text:
                            typeof m.content === 'string'
                                ? m.content
                                : JSON.stringify(m.content),
                    },
                ],
            };
            continue;
        }

        // USER
        if (m.role === 'user') {
            const parts: any[] = [];

            if (Array.isArray(m.content)) {
                for (const bloc of m.content) {

                    // IMAGE
                    if (bloc.type === 'image_url') {
                        const imageUrl = bloc.image_url?.url;

                        if (!imageUrl) {
                            continue;
                        }

                        const { mimeType, data } =
                            await this.telechargerImageEnBase64(imageUrl);

                        parts.push({
                            inlineData: {
                                mimeType,
                                data,
                            },
                        });

                        continue;
                    }

                    // TEXT
                    parts.push({
                        text: bloc.text ?? '',
                    });
                }
            } else {
                parts.push({
                    text:
                        typeof m.content === 'string'
                            ? m.content
                            : JSON.stringify(m.content),
                });
            }

            if (parts.length > 0) {
                contents.push({
                    role: 'user',
                    parts,
                });
            }

            continue;
        }

        // ASSISTANT / MODEL
        if (m.role === 'assistant') {
            const parts: any[] = [];

            if (m.content) {
                parts.push({
                    text: m.content,
                });
            }

            if (Array.isArray(m.tool_calls)) {
                for (const tc of m.tool_calls) {

                    let args: any = {};

                    try {
                        args =
                            typeof tc.function.arguments === 'string'
                                ? JSON.parse(tc.function.arguments)
                                : tc.function.arguments ?? {};
                    } catch {
                        args = {};
                    }

                    // CORRECTIF : le thoughtSignature doit être réinjecté en frère de
                    // functionCall (pas à l'intérieur), sinon Gemini rejette l'appel
                    // dès le tour suivant avec "missing a thought_signature".
                    parts.push({
                        functionCall: {
                            name: tc.function.name,
                            args,
                            ...(tc.id ? { id: tc.id } : {}),
                        },
                        ...(tc.thoughtSignature ? { thoughtSignature: tc.thoughtSignature } : {}),
                    });
                }
            }

            if (parts.length > 0) {
                contents.push({
                    role: 'model',
                    parts,
                });
            }

            continue;
        }

        // TOOL RESULT
        if (m.role === 'tool') {
            let resultat: any;

            try {
                resultat =
                    typeof m.content === 'string'
                        ? JSON.parse(m.content)
                        : m.content;
            } catch {
                resultat = {
                    result: m.content,
                };
            }

            contents.push({
                role: 'user',
                parts: [
                    {
                        functionResponse: {
                            name: m.name || 'proposerModification',
                            response: {
                                result: resultat,
                            },
                            ...(m.tool_call_id
                                ? { id: m.tool_call_id }
                                : {}),
                        },
                    },
                ],
            });

            continue;
        }
    }

    return {
        systemInstruction,
        contents,
    };
}
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
            case 'openrouter': return this.appelerOpenRouter(messages, outils, aDesImages);
            case 'gemini': return this.appelerGemini(messages, outils);
            case 'grok': return this.appelerGrok(messages, outils);
            case 'mistral': return this.appelerMistral(messages, outils);
            default: throw new Error(`Fournisseur IA inconnu : ${fournisseur}`);
        }
    }

    // ---------- OpenRouter ----------
    private async appelerOpenRouter(messages: any[], outils: any[] | null, aDesImages: boolean): Promise<ReponseIA> {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error('OPENROUTER_API_KEY manquante');
        const modeles = aDesImages ? this.MODELES_OPENROUTER_VISION : this.MODELES_OPENROUTER_TEXTE;
        let derniereErreur: Error | null = null;

        for (const modele of modeles) {
            try {
                this.logger.log(`Tentative OpenRouter avec ${modele}`);
                const reponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: modele, messages, ...(outils ? { tools: outils, tool_choice: 'auto' } : {}) }),
                });
                const donnees = await reponse.json();
                if (!reponse.ok || !donnees.choices) throw new Error(donnees.error?.message || `Erreur OpenRouter (${reponse.status})`);
                const message = donnees.choices[0].message;
                this.logger.log(`Réponse obtenue via OpenRouter/${modele}`);
                return { content: message.content ?? null, tool_calls: message.tool_calls ?? [] };
            } catch (erreur: any) {
                derniereErreur = erreur instanceof Error ? erreur : new Error(String(erreur));
                this.logger.warn(`Échec OpenRouter/${modele} : ${derniereErreur.message}`);
            }
        }
        throw new Error(`Tous les modèles OpenRouter ont échoué. Dernière erreur : ${derniereErreur?.message}`);
    }

    // ---------- Grok (xAI) — compatible OpenAI ----------
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

    // ---------- Mistral — compatible OpenAI également ----------
    private async appelerMistral(messages: any[], outils: any[] | null): Promise<ReponseIA> {
        const apiKey = process.env.MISTRAL_API_KEY;
        if (!apiKey) throw new Error('MISTRAL_API_KEY manquante dans le fichier .env');
        // Modèle gratuit courant sur La Plateforme Mistral — vérifie sur console.mistral.ai
        // si tu veux basculer sur un autre (mistral-large-latest est payant).
        const modele = process.env.MISTRAL_MODEL || 'mistral-small-latest';

        this.logger.log(`Tentative Mistral avec ${modele}`);
        const reponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modele, messages, ...(outils ? { tools: outils, tool_choice: 'auto' } : {}) }),
        });
        const donnees = await reponse.json();
        if (!reponse.ok || !donnees.choices) throw new Error(donnees.error?.message || `Erreur Mistral (${reponse.status})`);
        const message = donnees.choices[0].message;
        this.logger.log(`Réponse obtenue via Mistral/${modele}`);
        return { content: message.content ?? null, tool_calls: message.tool_calls ?? [] };
    }

    // ---------- Gemini — format différent, conversion nécessaire ----------
    private async appelerGemini(messages: any[], outils: any[] | null): Promise<ReponseIA> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY manquante dans le fichier .env');
        const modele = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

       const { systemInstruction, contents } = await this.convertirMessagesPourGemini(messages);
       // CORRECTIF : les outils sont désormais réellement convertis et envoyés à Gemini.
       // Avant, "const tools = undefined" empêchait TOUJOURS l'envoi du schéma d'outils,
       // forçant Gemini à halluciner ses appels de fonction sans déclaration valide.
       const tools = this.convertirOutilsPourGemini(outils);

        this.logger.log(`Tentative Gemini avec ${modele}`);
        let reponse: Response;
        try {
            reponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                    body: JSON.stringify({ ...(systemInstruction ? { system_instruction: systemInstruction } : {}), contents, ...(tools ? { tools } : {}) }),
                },
            );
        } catch (erreur: any) {
            // CORRECTIF : log du détail réel de l'échec réseau (cause), au lieu du
            // générique "fetch failed" qui ne permettait pas de diagnostiquer.
            this.logger.error(`Échec réseau Gemini (détail) : ${erreur?.cause ?? erreur?.message ?? erreur}`);
            throw erreur;
        }
        const donnees = await reponse.json();
        if (!reponse.ok || !donnees.candidates?.length) throw new Error(donnees.error?.message || `Erreur Gemini (${reponse.status})`);

        const parts = donnees.candidates[0].content?.parts ?? [];
        const texte = parts.filter((p: any) => p.text).map((p: any) => p.text).join('\n') || null;
        const tool_calls = parts
            .filter((p: any) => p.functionCall)
            .map((p: any, i: number) => ({
                id: `gemini-call-${i}`,
                type: 'function',
                function: { name: p.functionCall.name, arguments: JSON.stringify(p.functionCall.args ?? {}) },
                // CORRECTIF : on récupère le thoughtSignature renvoyé par Gemini pour
                // pouvoir le réinjecter au tour suivant (cf. convertirMessagesPourGemini).
                ...(p.thoughtSignature ? { thoughtSignature: p.thoughtSignature } : {}),
            }));

        this.logger.log(`Réponse obtenue via Gemini/${modele}`);
        return { content: texte, tool_calls };
    }


}