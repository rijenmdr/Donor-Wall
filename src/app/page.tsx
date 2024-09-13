import ZoomPanel from "@/components/ZoomPanel";

export default function Home() {
  return (
    <section className="min-h-[100dvh] wrapper py-10">
      <div className="py-4 px-2 md:px-0 sm:flex w-full justify-center">
        <div className="w-[100%] md:w-[95%] h-[400px] md:h-[720px] flex justify-center">
          <div className="!overflow-hidden relative w-full h-fit">
            <ZoomPanel />
          </div>
        </div>
      </div>
    </section>
  );
}
