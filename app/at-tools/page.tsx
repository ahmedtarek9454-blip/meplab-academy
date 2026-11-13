import { getLocale } from '@/lib/i18n';

export const metadata = {
  title: 'AT Tools for Revit — أدوات MEP و BIM مجانية | MEP LAB',
  description: 'إضافة Revit مجانية لمهندسي MEP و BIM: فلاتر وألوان الأنظمة، View Manager، فحص التوصيلات، تصدير Navisworks، حصر BOQ، Sleeves، ميول الصرف، Auto Tag، العزل، الـ Supports والـ Riser. Revit 2024 لحد 2027.',
  openGraph: { images: ['/at-tools/poster.jpg'] }
};

const VERSION = '1.5.1';
const SETUP = `/at-tools/AT-Tools-Setup-${VERSION}.exe`;
const VIDEO = `/at-tools/at-tools-${VERSION}.mp4`;

type G = { name: string; ar: string; en: string; items: [string, string, string][] };
// [tool, what it does in Arabic, in English]
const GROUPS: G[] = [
  { name: 'Filters', ar: 'فلاتر وألوان الأنظمة', en: 'System filters and colours', items: [
    ['Filter Manager', 'فلتر ولون لكل System Type في View Template جاهز', 'A filter and colour for every system type, in a ready view template'],
    ['Check the model', 'بيلوّن الـ Open ends والسرعات العالية والصرف من غير ميول', 'Colours open ends, high velocities and drainage laid flat'],
    ['Colour by parameter', 'لون لكل قيمة في أي Parameter، مع Legend', 'One colour per value of any parameter, with a legend']
  ] },
  { name: 'View Manager', ar: 'الـ Views والشيتات', en: 'Views and sheets', items: [
    ['View Templates', 'View Templates لكل سيستم ونوع', 'View templates per system and view type'],
    ['Sheets from views', 'Sheets من الـ Views بضغطة واحدة', 'Sheets from views in one click'],
    ['Worksets', 'كل عنصر بيتنقل لـ Workset السيستم بتاعه', 'Moves each element to its system workset']
  ] },
  { name: 'Section · Snapshot', ar: 'قطاعات سريعة و Snapshot', en: 'Quick sections and snapshots', items: [
    ['Temp Section', 'قطاع مؤقت من الـ View أو عبر أي عنصر', 'A temporary section from the view or through any element'],
    ['View Snapshot', 'صورة ثابتة من الـ View تتحط على شيت', 'A still image of the view that sits on a sheet']
  ] },
  { name: 'Check Connections', ar: 'فحص التوصيلات', en: 'Connection check', items: [
    ['Check Connections', 'يلاقي الـ Open ends والفجوات الصغيرة والـ fittings الناقصة', 'Finds open ends, small gaps and missing fittings'],
    ['Zoom · Auto-connect', 'Zoom و Select للمشكلة، و Auto-connect وإدارة أسماء الأنظمة', 'Zoom to and select each problem, auto-connect and rename systems']
  ] },
  { name: 'Navisworks', ar: 'تصدير Navisworks', en: 'Navisworks export', items: [
    ['Navis View', 'View جاهز للتصدير', 'A view ready for export'],
    ['NWC per System', 'ملف NWC لكل System أو Discipline', 'One NWC file per system or discipline'],
    ['Navisworks Clashes', 'حمّل تقرير الـ Clashes (XML) وشوف كل Clash جوه Revit', 'Load the clash report (XML) and review each clash in Revit']
  ] },
  { name: 'MEP Tools', ar: 'أدوات الـ MEP', en: 'MEP tools', items: [
    ['BOQ', 'حصر المواسير والدكت والـ fittings بالـ Level، وتصدير Excel', 'Pipes, ducts and fittings by level, exported to Excel'],
    ['Sleeves', 'Sleeve لكل ماسورة أو دكت بيعدّي حيطة أو أرضية، حتى في الـ Linked models', 'A sleeve wherever a pipe or duct crosses a wall or floor, linked models included'],
    ['Drainage slopes', 'يلاقي الصرف الفلات أو أقل من الميل ويطبّق الميل اللي تختاره', 'Finds flat or under-sloped drainage and applies your slope'],
    ['Auto Tag', 'تاج للـ View كله بمسافات ثابتة ومن غير تداخل', 'Tags the whole view at fixed spacing, without overlaps'],
    ['Insulation', 'العزل بالقواعد حسب النوع والمقاس، على الموديل كله مرة واحدة', 'Insulation by rules for type and size, across the model at once'],
    ['Supports & Hangers', 'Hangers على مسافات ثابتة والـ Rod بيوصل للبلاطة أو الكمرة', 'Hangers at fixed spacing, rods run up to the slab or beam'],
    ['Riser Diagram', 'Riser diagram من الموديل بالـ Levels وألوان الأنظمة', 'A riser diagram from the model, with levels and system colours'],
    ['Model Health', 'يفحص الموديل ويصدّر التقرير Excel', 'Checks the model and exports the report to Excel']
  ] }
];

export default async function AtToolsPage() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const fb = process.env.NEXT_PUBLIC_MESSENGER_URL || 'https://m.me/MEPLAB.EGY';
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  const msg = ar ? 'السلام عليكم، عايز رخصة AT Tools. الـ Machine ID بتاعي: ' : 'Hello, I would like an AT Tools licence. My Machine ID: ';
  const licenceHref = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(msg)}` : fb;

  return (
    <>
      <section className="border-b-[1.5px] border-ink bg-sheet">
        <div className="container-x grid items-center gap-10 pb-14 pt-12 md:grid-cols-[1fr,1.15fr] md:pb-16 md:pt-14">
          <div>
            <span className="badge rounded-[3px] border border-brand-blue px-2.5 py-1 text-sm text-brand-blue">{ar ? 'مجانية لأي مهندس محتاجها' : 'Free for any engineer who needs it'}</span>
            <h1 className="display mt-5 text-[2.4rem] leading-tight md:text-[3.4rem]" dir="ltr" style={{ textAlign: ar ? 'right' : 'left' }}>AT Tools for Revit</h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-ink-soft">
              {ar
                ? 'إضافة لـ Revit فيها أدوات الـ MEP والـ BIM اللي بتاخد وقت كل يوم: فلاتر الأنظمة، الـ Views والشيتات، فحص التوصيلات، تصدير Navisworks، الحصر، الـ Sleeves، الميول، التاجات، العزل والـ Supports.'
                : 'A Revit add-in with the MEP and BIM tools that eat time every day: system filters, views and sheets, connection checks, Navisworks export, quantities, sleeves, slopes, tags, insulation and supports.'}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={SETUP} download className="btn-red px-6 py-3.5 text-base">{ar ? `نزّل AT Tools ${VERSION}` : `Download AT Tools ${VERSION}`}</a>
              <a href="#video" className="btn-ghost px-6 py-3.5 text-base">{ar ? 'اتفرج على الشرح' : 'Watch the walkthrough'}</a>
            </div>
            <p className="mt-4 text-sm text-ink-mute" dir="ltr" style={{ textAlign: ar ? 'right' : 'left' }}>Revit 2024 · 2025 · 2026 · 2027 · Windows · 11 MB</p>
          </div>
          <div id="video" className="scroll-mt-24">
            <div className="overflow-hidden rounded-[3px] border-[1.5px] border-ink bg-ink">
              <video controls preload="metadata" poster="/at-tools/poster.jpg" className="aspect-video w-full" src={VIDEO}>
                <a href={VIDEO}>{ar ? 'نزّل الفيديو' : 'Download the video'}</a>
              </video>
            </div>
            <p className="mt-2 text-sm text-ink-mute">{ar ? 'شرح الأدوات في دقيقتين' : 'The tools in two minutes'}</p>
          </div>
        </div>
      </section>

      <section className="container-x py-14">
        <h2 className="display text-3xl">{ar ? 'الأدوات' : 'The tools'}</h2>
        <p className="mt-2 text-ink-soft">{ar ? 'كلهم في تاب واحد في Revit اسمه AT Tools.' : 'All in one Revit tab called AT Tools.'}</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {GROUPS.map((g) => (
            <div key={g.name} className="card p-6">
              <div className="text-sm font-bold text-brand-blue" dir="ltr" style={{ textAlign: ar ? 'right' : 'left' }}>{g.name}</div>
              <h3 className="mt-1 text-xl font-bold text-ink">{ar ? g.ar : g.en}</h3>
              <ul className="mt-4 space-y-3">
                {g.items.map(([tool, a, e]) => (
                  <li key={tool} className="border-t border-line pt-3">
                    <div className="font-bold text-ink" dir="ltr" style={{ textAlign: ar ? 'right' : 'left' }}>{tool}</div>
                    <div className="mt-0.5 text-sm leading-6 text-ink-soft">{ar ? a : e}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y-[1.5px] border-ink bg-paper">
        <div className="container-x grid gap-10 py-14 md:grid-cols-2">
          <div>
            <h2 className="display text-3xl">{ar ? 'التسطيب' : 'Install'}</h2>
            <ol className="mt-6 space-y-4">
              {(ar
                ? ['اقفل Revit.', `شغّل AT Tools Setup ${VERSION}. مش محتاج Admin.`, 'الـ Setup بيلاقي لوحده نسخ Revit 2024 لحد 2027 اللي على جهازك.', 'افتح Revit هتلاقي تاب AT Tools.']
                : ['Close Revit.', `Run AT Tools Setup ${VERSION}. No admin rights needed.`, 'The setup finds the Revit 2024 to 2027 versions on your computer by itself.', 'Open Revit and you will find the AT Tools tab.']
              ).map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink text-sm font-bold">{i + 1}</span>
                  <span className="pt-0.5 leading-7 text-ink-soft">{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6 rounded-[3px] border-[1.5px] border-dashed border-ink-mute bg-white p-4 text-sm leading-7 text-ink-soft">
              {ar
                ? <>لو ويندوز طلّعلك <b dir="ltr">Windows protected your PC</b>، اضغط <b dir="ltr">More info</b> وبعدين <b dir="ltr">Run anyway</b>. ده بيظهر لأي برنامج جديد مش عليه توقيع شركة.</>
                : <>If Windows shows <b>Windows protected your PC</b>, click <b>More info</b>, then <b>Run anyway</b>. It appears for any new program without a company signature.</>}
            </div>
            <p className="mt-4 text-sm text-ink-mute">{ar ? 'لإلغاء التسطيب: شغّل الـ Setup واختار Remove.' : 'To uninstall: run the setup and choose Remove.'}</p>
          </div>
          <div>
            <h2 className="display text-3xl">{ar ? 'التجربة والرخصة' : 'Trial and licence'}</h2>
            <ol className="mt-6 space-y-4">
              {(ar
                ? ['أول 30 يوم مجانًا، وكل الأدوات شغالة من غير رخصة.', 'بعد الـ 30 يوم: من AT Tools > License انسخ الـ Machine ID.', 'ابعت الـ Machine ID، وهيوصلك ملف الرخصة مجانًا.', 'Load license file، أو الصق النص واضغط Activate pasted text.']
                : ['The first 30 days are free, with every tool working without a licence.', 'After 30 days: copy your Machine ID from AT Tools > License.', 'Send us the Machine ID and you will get your licence file, free.', 'Load license file, or paste the text and click Activate pasted text.']
              ).map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink text-sm font-bold">{i + 1}</span>
                  <span className="pt-0.5 leading-7 text-ink-soft">{s}</span>
                </li>
              ))}
            </ol>
            <a href={licenceHref} target="_blank" rel="noopener" className="btn-ghost mt-6">{ar ? 'ابعت الـ Machine ID' : 'Send your Machine ID'}</a>
          </div>
        </div>
      </section>

      <section className="container-x py-16 text-center">
        <p className="hand text-[1.9rem] md:text-[2.3rem]">{ar ? 'ولو الأدوات نفعتك.. ادعي لوالدي بالرحمة' : 'If the tools help you, please pray for my late father'}</p>
        <p className="mt-3 text-ink-soft" dir="ltr">Ahmed Tarek · BIM Mechanical Engineer</p>
        <a href={SETUP} download className="btn-red mt-8 px-6 py-3.5 text-base">{ar ? `نزّل AT Tools ${VERSION}` : `Download AT Tools ${VERSION}`}</a>
      </section>
    </>
  );
}
