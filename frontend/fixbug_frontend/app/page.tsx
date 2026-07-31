import { Navbar } from "./components/landing/navbar";
import { Hero } from "./components/landing/hero";
import { FeatureSection } from "./components/landing/feature-section";
import { Footer } from "./components/landing/footer";
import { FadeIn } from "./components/animations/fade-in";


export default function LandingPage() {
  return (
    <main className="bg-white">
      <Navbar />
      <FadeIn delay={0.1} direction="left">
        <Hero />
      </FadeIn>
      <FadeIn delay={0.2} direction="right">
      <FeatureSection
        imageUrl="buglanding.jpg"
        title="Détection Intelligente par IA"
        description="Notre moteur d'IA analyse vos extraits de code et vos logs pour identifier instantanément la cause racine des bugs, réduisant le temps de diagnostic de 60%."
        items={[
          { label: "Analyse sémantique du code" },
          { label: "Corrélation automatique des logs" },
          { label: "Suggestions de correctifs" },
          { label: "Détection des régressions" },
        ]}
        panelClassName="bg-sky-50"
      /> </FadeIn>
      <FadeIn>
      <div className="w-full h-16 bg-slate-50 rounded-2xl shadow-2xl"></div>
      <Footer /> </FadeIn>
    </main>
  );
}
