import SlaidoClient from "@/components/SlaidoClient";
import { getMongodb } from "@/lib/mongodb";

export default async function Home() {
  const Mongodb = await getMongodb();

  return (
    <main>
      <div>
        <h1>Slaido</h1>
      </div>
      <SlaidoClient initialTodos={Mongodb} />
    </main>
  );
}
