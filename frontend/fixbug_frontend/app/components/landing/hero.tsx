

export function Hero() {

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-24">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Résolvez vos <span className="italic text-red-500">bugs</span>{" "}
            plus vite avec l'intelligence artificielle.
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-slate-500">
            FixBug transforme la gestion des anomalies logicielles. Automatisez
            collaborez sans friction et assurez des déploiements de
            haute qualité.
          </p>
        </div>

       
        <div className='bg-slate-200 m-4 rounded-2xl max-w-3xl mx-auto shadow-2xl border cursor-pointer active:scale-125 hover:bg-slate-300'>
       <img  className=" rounded-2xl   object-top" src="buglanding.jpg" alt="" />
      </div>
      </div>
    </section>
  );
}
