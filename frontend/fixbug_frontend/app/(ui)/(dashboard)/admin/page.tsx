"use client";
import { ShieldUser, User } from 'lucide-react';
import { useState, useEffect, useCallback } from "react";
import { Plus, Search, MoreVertical, Ban, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

type Utilisateur = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: "TESTEUR" | "CHEF_PROJET" | "ADMINISTRATEUR";
  actif: boolean;
};

const labelsRole: Record<string, string> = {
  TESTEUR: "Testeur",
  CHEF_PROJET: "Chef de projet",
  ADMINISTRATEUR: "Administrateur",
};

export default function UtilisateursAdminPage() {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [recherche, setRecherche] = useState("");
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [utilisateurASupprimer, setUtilisateurASupprimer] = useState<Utilisateur | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  const chargerUtilisateurs = useCallback(async () => {
    setChargement(true);
    try {
      const data = await apiFetch(
        `/users/admin/utilisateurs?page=${page}&limit=10&recherche=${encodeURIComponent(recherche)}`,
      );
      setUtilisateurs(data.data);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setChargement(false);
    }
  }, [page, recherche]);

  useEffect(() => {
    chargerUtilisateurs();
  }, [chargerUtilisateurs]);

  async function handleActiverDesactiver(utilisateur: Utilisateur) {
    const chemin = utilisateur.actif
      ? `/users/admin/utilisateurs/${utilisateur.id}/desactiver`
      : `/users/admin/utilisateurs/${utilisateur.id}/activer`;
    try {
      await apiFetch(chemin, { method: "PATCH" });
      chargerUtilisateurs();
    } catch (err) {
      console.error(err);
    }
  }

  async function confirmerSuppression() {
    if (!utilisateurASupprimer) return;
    setSuppressionEnCours(true);
    try {
      await apiFetch(`/users/admin/utilisateurs/${utilisateurASupprimer.id}`, { method: "DELETE" });
      setUtilisateurASupprimer(null);
      chargerUtilisateurs();
    } catch (err) {
      console.error(err);
    } finally {
      setSuppressionEnCours(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#12151F]">Utilisateurs</h1>
          <p className="text-sm text-slate-500">Gérez les comptes de la plateforme.</p>
        </div>
        <DialogNouvelUtilisateur
          ouvert={dialogOuvert}
          onOuvertChange={setDialogOuvert}
          onCree={chargerUtilisateurs}
        />
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Rechercher un utilisateur..."
          className="pl-9"
          value={recherche}
          onChange={(e) => {
            setPage(1);
            setRecherche(e.target.value);
          }}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <Table className="border rounded-2xl">
          <TableHeader>
            <TableRow className="bg-black hover:bg-black">
              <TableHead className="text-white">Nom complet</TableHead>
              <TableHead className="text-white">Email</TableHead>
              <TableHead className="text-white">Rôle</TableHead>
              <TableHead className="text-white">Statut</TableHead>
              <TableHead className="text-right text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chargement ? (
              Array.from({ length: 5 }).map((_, i) => <LigneSkeleton key={i} />)
            ) : utilisateurs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                  Aucun utilisateur trouvé.
                </TableCell>
              </TableRow>
            ) : (
              utilisateurs.map((utilisateur) => (
                <TableRow key={utilisateur.id}>
                  <TableCell className="font-medium text-[#12151F]">
                    {utilisateur.prenom} {utilisateur.nom}
                  </TableCell>
                  <TableCell className="text-slate-600">{utilisateur.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={utilisateur.role === "CHEF_PROJET" ? "font-normal bg-sky-50 text-sky-900 gap-1" : "font-normal bg-green-50 text-green-900 gap-1"}
                    >
                      {utilisateur.role === "CHEF_PROJET" ? <ShieldUser className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                      {labelsRole[utilisateur.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={utilisateur.actif ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                      {utilisateur.actif ? "Actif" : "Désactivé"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <DropdownMenu>
                        {/* Pas de asChild/render ici : le Trigger est lui-même le bouton cliquable,
                            on ne lui donne pas d'élément à remplacer, juste du contenu à l'intérieur. */}
                        <DropdownMenuTrigger className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleActiverDesactiver(utilisateur)}>
                            {utilisateur.actif ? (
                              <><Ban className="mr-2 h-4 w-4" /> Désactiver</>
                            ) : (
                              <><CheckCircle2 className="mr-2 h-4 w-4" /> Activer</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setUtilisateurASupprimer(utilisateur)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {page} sur {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Précédent</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Suivant</Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!utilisateurASupprimer} onOpenChange={(ouvert) => !ouvert && setUtilisateurASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>voulez vous supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.l'utilisateur {utilisateurASupprimer?.prenom}  perdra l'accès à la plateforme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmerSuppression}
              disabled={suppressionEnCours}
              className="bg-red-600 hover:bg-red-700"
            >
              {suppressionEnCours ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LigneSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
      <TableCell className="flex justify-end"><Skeleton className="h-8 w-8 rounded" /></TableCell>
    </TableRow>
  );
}

function DialogNouvelUtilisateur({
  ouvert, onOuvertChange, onCree,
}: {
  ouvert: boolean;
  onOuvertChange: (v: boolean) => void;
  onCree: () => void;
}) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"TESTEUR" | "CHEF_PROJET" | "ADMINISTRATEUR">("TESTEUR");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await apiFetch("/users/admin/utilisateurs", {
        method: "POST",
        body: JSON.stringify({ nom, prenom, email, role }),
      });
      setNom(""); setPrenom(""); setEmail(""); setRole("TESTEUR");
      onOuvertChange(false);
      onCree();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setChargement(false);
    }
  }

  return (
    <Dialog open={ouvert} onOpenChange={onOuvertChange}>
      <DialogTrigger render={<Button className="bg-[#12151F] hover:bg-[#12151F]/90" />}>
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