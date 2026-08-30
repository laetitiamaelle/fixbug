"use client";
import { StatsCards, StatistiquesUtilisateurs } from "../../../components/utilisateurs/stats-card";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { DataTable } from "../../../components/utilisateurs/data-table";
import { creerColonnes, Utilisateur } from "../../../components/utilisateurs/columns";

export default function UtilisateursAdminPage() {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rechercheInput, setRechercheInput] = useState("");
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState<"TOUS" | "actif" | "desactive">("TOUS");
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [utilisateurASupprimer, setUtilisateurASupprimer] = useState<Utilisateur | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [stats, setStats] = useState<StatistiquesUtilisateurs | null>(null);
  const [statsChargement, setStatsChargement] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setRecherche(rechercheInput);
    }, 400);
    return () => clearTimeout(t);
  }, [rechercheInput]);

  const chargerStats = useCallback(async () => {
    setStatsChargement(true);
    try {
      const data = await apiFetch("/users/admin/utilisateurs/statistiques");
      setStats(data);
    } catch (err) {
      console.error(err);
      toast.error("Erreur", { description: "Impossible de charger les statistiques." });
    } finally {
      setStatsChargement(false);
    }
  }, []);

  useEffect(() => {
    chargerStats();
  }, [chargerStats]);

  const chargerUtilisateurs = useCallback(async () => {
    setChargement(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "6", recherche });
      if (statut !== "TOUS") params.set("statut", statut);

      const data = await apiFetch(`/users/admin/utilisateurs?${params.toString()}`);
      setUtilisateurs(data.data);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Erreur", { description: "Impossible de charger la liste des utilisateurs." });
    } finally {
      setChargement(false);
    }
  }, [page, recherche, statut]);

  useEffect(() => {
    chargerUtilisateurs();
  }, [chargerUtilisateurs]);

  async function handleActiverDesactiver(utilisateur: Utilisateur) {
    const chemin = utilisateur.actif
      ? `/users/admin/utilisateurs/${utilisateur.id}/desactiver`
      : `/users/admin/utilisateurs/${utilisateur.id}/activer`;
    try {
      await apiFetch(chemin, { method: "PATCH" });
      if (utilisateur.actif) {
        toast.warning("Compte désactivé", { description: `Le compte de ${utilisateur.prenom} ${utilisateur.nom} a été désactivé.` });
      } else {
        toast.success("Compte activé", { description: `Le compte de ${utilisateur.prenom} ${utilisateur.nom} a été activé.` });
      }
      chargerUtilisateurs();
    } catch (err) {
      console.error(err);
      toast.error("Erreur", { description: `Erreur lors de la modification du statut de ${utilisateur.prenom}.` });
    }
  }

  async function confirmerSuppression() {
    if (!utilisateurASupprimer) return;
    setSuppressionEnCours(true);
    try {
      await apiFetch(`/users/admin/utilisateurs/${utilisateurASupprimer.id}`, { method: "DELETE" });
      toast.success("Utilisateur supprimé", { description: `Le compte de ${utilisateurASupprimer.prenom} ${utilisateurASupprimer.nom} a été supprimé.` });
      setUtilisateurASupprimer(null);
      chargerUtilisateurs();
    } catch (err) {
      console.error(err);
      toast.error("Erreur", { description: "Erreur lors de la suppression de l'utilisateur." });
    } finally {
      setSuppressionEnCours(false);
    }
  }

  const colonnes = useMemo(
    () => creerColonnes({
      onActiverDesactiver: handleActiverDesactiver,
      onSupprimer: setUtilisateurASupprimer,
    }),
    []
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#12151F] text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#12151F]">Utilisateurs</h1>
            <p className="text-sm text-slate-500">Gérez les comptes de la plateforme et suivez leur activité.</p>
          </div>
        </div>
        <DialogNouvelUtilisateur ouvert={dialogOuvert} onOuvertChange={setDialogOuvert} onCree={chargerUtilisateurs} />
      </div>
 <div className="mb-6"><StatsCards stats={stats} chargement={statsChargement} /></div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-55">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Rechercher un utilisateur..."
            className="pl-9"
            value={rechercheInput}
            onChange={(e) => setRechercheInput(e.target.value)}
          />
        </div>
        <Select value={statut} onValueChange={(v) => { setPage(1); setStatut(v as typeof statut); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TOUS">Tous les statuts</SelectItem>
            <SelectItem value="actif">Actif</SelectItem>
            <SelectItem value="desactive">Désactivé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={colonnes} data={utilisateurs} chargement={chargement} />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {page} sur {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Précédent</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Suivant</Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!utilisateurASupprimer} onOpenChange={(o) => !o && setUtilisateurASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Voulez-vous supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'utilisateur {utilisateurASupprimer?.prenom} perdra l'accès à la plateforme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmerSuppression} disabled={suppressionEnCours} className="bg-red-600 hover:bg-red-700">
              {suppressionEnCours ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DialogNouvelUtilisateur({
  ouvert, onOuvertChange, onCree,
}: { ouvert: boolean; onOuvertChange: (v: boolean) => void; onCree: () => void }) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"TESTEUR" | "CHEF_PROJET" | "DEVELOPPEUR">("TESTEUR");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await apiFetch("/users/admin/utilisateurs", { method: "POST", body: JSON.stringify({ nom, prenom, email, role }) });
      toast.success("Utilisateur créé", { description: `Le compte de ${prenom} ${nom} a été créé avec succès.` });
      setNom(""); setPrenom(""); setEmail(""); setRole("TESTEUR");
      onOuvertChange(false);
      onCree();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de la création";
      setErreur(message);
      toast.error("Erreur de création", { description: message });
    } finally {
      setChargement(false);
    }
  }

  return (
    <Dialog open={ouvert} onOpenChange={onOuvertChange}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-[#12151F] px-4 py-2 text-sm font-medium text-white hover:bg-[#12151F]/90 transition-colors">
        <Plus className="mr-2 h-4 w-4" /> Nouvel utilisateur
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Créer un utilisateur</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TESTEUR">Testeur</SelectItem>
                <SelectItem value="CHEF_PROJET">Chef de projet</SelectItem>
                <SelectItem value="DEVELOPPEUR">Developeur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
          <DialogFooter>
            <Button type="submit" disabled={chargement} className="bg-[#12151F] hover:bg-[#12151F]/90">
              {chargement ? "Création..." : "Créer l'utilisateur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}