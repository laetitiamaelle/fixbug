import { Workflow } from "lucide-react";

export function SignupAside() {
  return (
    <div className="hidden flex-col  p-6 md:flex md:w-1/2 lg:p-8">
      <div className="flex flex-1 flex-col space-y-5 rounded-2xl bg-slate-100 p-8">
        <section className='bg-slate-200 m-4 rounded-2xl  max-w-3xl mx-auto shadow-2xl border cursor-pointer hover:scale-90 hover:bg-slate-300'>
       <img  className=" rounded-2xl  object-cover object-top"src="/inscription.jpg" alt="" />
       
      </section>

        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Éliminez les bugs plus rapidement
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Notre IA analyse vos rapports pour suggérer des correctifs et
            prioriser les anomalies critiques en temps réel.
          </p>

        </div>
      </div>

     
    </div>
  );
}
