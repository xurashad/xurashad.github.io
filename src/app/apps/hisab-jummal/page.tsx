import type { Metadata } from "next";
import { HisabJummalApp } from "./HisabJummalApp";
import {
  Hash,
  BookOpen,
  Sparkles,
  Layers,
  ArrowRightLeft,
  Flame,
  Globe,
  HelpCircle,
  History,
  FileText,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "حساب الجُمَّل — Abjad Calculator & Gematria Analyzer | Rashad Hamidi",
  description:
    "حاسبة حساب الجُمَّل للكلمات والجمل العربية وفق الترتيبين المشرقي والمغربي، مع تفصيل الحروف والكلمات، الجُمّل الصغير واللفظي، الجذور الرقمية، ومساعد التأريخ الشعري ودليل شامل لتاريخ الحساب.",
  keywords: [
    "حساب الجمل",
    "Hisab al-Jummal",
    "Abjad numerals",
    "Arabic gematria",
    "أبجد هوز",
    "التأريخ الشعري",
    "الجمل الكبير والصغير",
    "بسط الحروف",
    "حساب الكلمات العربية",
    "Rashad Hamidi",
  ],
};

const FEATURES = [
  {
    icon: Hash,
    label: "النظامان المشرقي والمغربي",
    desc: "دعم كامل للترتيب المشرقي القياسي والترتيب المغربي الأندلسي بدقة مطلقة.",
  },
  {
    icon: Layers,
    label: "تشريح حرفي وتحليل الكلمات",
    desc: "تفكيك الكلمات حرفاً بحرف مع إظهار وزن كل كلمة ونسبتها من المجموع الكلي.",
  },
  {
    icon: Sparkles,
    label: "الكبير والصغير واللفظي",
    desc: "حساب الجمل الكبير، والجمل الصغير بحذف الأصفار، والجذر الرقمي (1-9)، وبسط الحروف.",
  },
  {
    icon: History,
    label: "مساعد التأريخ الشعري",
    desc: "أداة متخصصة لمطابقة الأشطار الشعرية مع السنوات الهجرية والميلادية والبحث العكسي.",
  },
];

export default function HisabJummalPage() {
  return (
    <div className="min-h-screen keffiyeh-bg">
      {/* Background ambient glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[110px]" />
        <div className="absolute bottom-1/3 -right-20 w-96 h-96 rounded-full bg-olive/5 blur-[120px]" />
      </div>

      <div className="section-container py-14 pb-32">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-12">
          {/* Breadcrumb badge */}
          <div className="flex items-center gap-2 mb-3 text-xs font-mono text-quantum/65 tracking-widest uppercase">
            <Link href="/apps" className="hover:text-quantum transition-colors">
              Apps
            </Link>
            <span>/</span>
            <span>Heritage & Linguistics</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-4 tracking-tight leading-tight">
            <span className="gradient-text-quantum font-serif">حساب الجُمَّل</span>{" "}
            <span className="text-foreground/60 text-3xl sm:text-4xl lg:text-5xl font-sans font-light">
              — Abjad Calculator & Analyzer
            </span>
          </h1>

          <p className="text-foreground/55 max-w-3xl leading-relaxed text-sm sm:text-base font-serif">
            أداة تفاعلية متقدمة لحساب القيمة العددية للكلمات والجمل والآيات العربية وفق نظام{" "}
            <span className="text-quantum/80 font-mono font-bold">أبجد هوز</span> التاريخي. تتيح
            التحويل الفوري بين الترتيبين المشرقي والمغربي، مع تفكيك دقيق لكل حرف وكلمة، وحساب الجُمَّل
            الكبير والصغير واللفظي، ومساعد متقدم للتأريخ الشعري والبحث العكسي.
          </p>

          {/* Quick Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-8">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="glass-card p-4 flex flex-col gap-2 hover:border-quantum/25 transition-colors duration-300"
              >
                <div className="flex items-center gap-2 text-quantum">
                  <Icon size={16} />
                  <span className="text-xs font-bold text-foreground/80">{label}</span>
                </div>
                <p className="text-[11px] text-foreground/45 leading-relaxed font-serif">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── The Interactive App ─────────────────────────────────────────── */}
        <HisabJummalApp />

        {/* ── Comprehensive Guidance & Educational Reference ──────────────── */}
        <div className="mt-24 pt-16 border-t border-white/10 space-y-16" dir="rtl">
          {/* Guidance Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-olive/15 text-olive-300 border border-olive/30 text-xs font-mono">
              <BookOpen size={12} />
              <span>دليل معرفي شامل</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground/90">
              دليل وفلسفة حساب الجُمَّل في التراث العربي
            </h2>
            <p className="text-xs sm:text-sm text-foreground/50 leading-relaxed font-serif">
              شرح وافٍ لأصول حساب الجمل، تاريخ نشأته، الترتيب الأبجدي، الفروق بين المشرق والمغرب، وفن
              التأريخ الشعري وتطبيقاته.
            </p>
          </div>

          {/* 6 Rich Knowledge Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Guide Card 1 */}
            <div className="glass-card p-6 sm:p-7 border border-white/8 rounded-2xl space-y-3">
              <div className="flex items-center gap-2.5 text-quantum text-base font-bold font-serif">
                <History size={18} />
                <h3>1. ما هو حساب الجُمَّل؟ وما أصله التاريخي؟</h3>
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed font-serif">
                حساب الجُمَّل (ويُقال أيضاً حساب الأبجدية أو الترقيم بالألفاظ) هو نظام رياضي قديم
                يُقابل فيه كل حرف من حروف الهجاء العربية قيمة عددية محددة من 1 إلى 1000.
              </p>
              <p className="text-xs text-foreground/50 leading-relaxed font-serif">
                نشأ هذا النظام في اللغات السامية القديمة (كالأوجاريتية والفينيقية والآرامية والنبطية)
                قبل أن يعرف العرب الأرقام الهندية (0، 1، 2، 3...) التي أدخلها الخوارزمي في القرن الثالث
                الهجري. فكان العرب والشعوب السامية يُسجلون أعدادهم وحساباتهم وموازينهم وأعمارهم
                باستعمال الحروف الأبجدية كأرقام مكتوبة.
              </p>
            </div>

            {/* Guide Card 2 */}
            <div className="glass-card p-6 sm:p-7 border border-white/8 rounded-2xl space-y-3">
              <div className="flex items-center gap-2.5 text-olive-400 text-base font-bold font-serif">
                <Layers size={18} />
                <h3>2. منظومة أبجد هوز مقابل الترتيب الهجائي</h3>
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed font-serif">
                يترتب حساب الجمل على الترتيب السامي القديم للحروف وليس على الترتيب الألفبائي المألوف
                اليوم (أ، ب، ت، ث...). فقد صاغ العرب الأوائل هذا الترتيب في ثماني كلمات شهيرة لتسهيل
                حفظها:
              </p>
              <div className="p-3 rounded-xl bg-white/3 border border-white/6 text-xs text-foreground/80 font-serif text-center font-bold tracking-wider">
                أَبْجَدْ · هَوَّزْ · حُطِّي · كَلَمُنْ · سَعْفَصْ · قَرَشَتْ · ثَخَذْ · ضَظَغْ
              </div>
              <p className="text-xs text-foreground/50 leading-relaxed font-serif">
                أما الترتيب الهجائي الحالي (أ ب ت ث ج ح خ...) فقد وضعه نصر بن عاصم ويحيى بن يعمر في عهد
                الخليفة الأموي عبد الملك بن مروان لتسهيل تعليم القراءة والقرآن بجمع الحروف المتشابهة في
                الرسم معاً.
              </p>
            </div>

            {/* Guide Card 3 */}
            <div className="glass-card p-6 sm:p-7 border border-white/8 rounded-2xl space-y-3">
              <div className="flex items-center gap-2.5 text-amber-400 text-base font-bold font-serif">
                <ArrowRightLeft size={18} />
                <h3>3. الفرق الجوهري بين الترتيب المشرقي والمغربي</h3>
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed font-serif">
                اتفق المشرق والمغرب في قيم أغلب الحروف (22 حرفاً)، واختلفا في ترتيب وقيم 6 حروف فقط
                نتيجة اختلاف نطق وإدغام الكلمات الأبجدية في بلاد المغرب العربي والأندلس:
              </p>
              <ul className="text-xs text-foreground/50 space-y-1.5 list-disc list-inside font-serif">
                <li>
                  في المشرق: <strong>سعفص (س=60، ص=90)</strong>، وفي المغرب:{" "}
                  <strong>صعفض (ص=60، ض=90)</strong>.
                </li>
                <li>
                  في المشرق: <strong>قرشت (ش=300)</strong>، وفي المغرب:{" "}
                  <strong>قرست (س=300)</strong>.
                </li>
                <li>
                  في المشرق: <strong>ضظغ (ض=800، ظ=900، غ=1000)</strong>، وفي المغرب:{" "}
                  <strong>ظغش (ظ=800، غ=900، ش=1000)</strong>.
                </li>
              </ul>
            </div>

            {/* Guide Card 4 */}
            <div className="glass-card p-6 sm:p-7 border border-white/8 rounded-2xl space-y-3">
              <div className="flex items-center gap-2.5 text-quantum text-base font-bold font-serif">
                <Sparkles size={18} />
                <h3>4. أنواع حساب الجُمَّل: الكبير والصغير واللفظي</h3>
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed font-serif">
                تفرع عن حساب الجمل في التراث عدة طرائق ومستويات حسابية:
              </p>
              <div className="space-y-2 text-xs text-foreground/50 font-serif">
                <div>
                  <strong className="text-foreground/80">1. الجُمَّل الكبير (المطلق):</strong> جمع
                  القيم العددية الكاملة لجميع الحروف (1..1000) وهو الأكثر شيوعاً.
                </div>
                <div>
                  <strong className="text-foreground/80">2. الجُمَّل الصغير:</strong> رد العشرات
                  والمئات والألوف إلى خانة الآحاد بإسقاط الأصفار (فـ ك=20 تصبح 2، وق=100 تصبح 1).
                </div>
                <div>
                  <strong className="text-foreground/80">3. الجذر الرقمي:</strong> اختزال الخانات
                  بالجمع التكراري حتى الوصول إلى رقم مفرد بين 1 و9.
                </div>
                <div>
                  <strong className="text-foreground/80">4. الجُمَّل اللفظي (البسط):</strong> حساب
                  القيمة بعد كتابة اسم الحرف ملفوظاً (فـ أ تُحسب "ألف" = 1+30+80 = 111).
                </div>
              </div>
            </div>

            {/* Guide Card 5 */}
            <div className="glass-card p-6 sm:p-7 border border-white/8 rounded-2xl space-y-3">
              <div className="flex items-center gap-2.5 text-olive-400 text-base font-bold font-serif">
                <BookOpen size={18} />
                <h3>5. فن التأريخ الشعري عند العرب</h3>
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed font-serif">
                ابتدع الشعراء والعلماء العرب في العصور المتأخرة فناً أدبياً بديعاً يُعرف بـ{" "}
                <strong>التأريخ الشعري</strong>. كان الشاعر ينظم قصيدة في مناسبة (بناء جامع أو قلعة،
                ولادة، أو وفاة عالم)، ويجعل الشطر الأخير منها يحمل تاريخ تلك الحادثة بحساب الجمل!
              </p>
              <p className="text-xs text-foreground/50 leading-relaxed font-serif">
                وكان الشاعر يسبق هذا الشطر بعبارات مفتاحية مثل: «وقلتُ مؤرخاً»، أو «مذ قلتُ
                تاريخاً»، أو «تاريخه:». فإذا جمع القارئ حساب جمل الشطر الموالي، وجد السنة الهجرية للحدث
                بالتمام والكمال دون زيادة أو نقصان.
              </p>
            </div>

            {/* Guide Card 6 */}
            <div className="glass-card p-6 sm:p-7 border border-white/8 rounded-2xl space-y-3">
              <div className="flex items-center gap-2.5 text-crimson text-base font-bold font-serif">
                <HelpCircle size={18} />
                <h3>6. قواعد إملائية وضوابط حسابية هامة</h3>
              </div>
              <ul className="text-xs text-foreground/50 space-y-1.5 list-disc list-inside font-serif leading-relaxed">
                <li>
                  <strong>الحركات والتنوين:</strong> الحركات (فتحة، ضمة، كسرة، سكون، تنوين) لا تحسب
                  إطلاقاً، لأن الحساب يتبع الحروف المكتوبة.
                </li>
                <li>
                  <strong>التاء المربوطة (ة):</strong> الأصل عند جمهور الحسابيين أنها تُحسب 5 (كالهاء)
                  لأنها تُنطق هاءً عند الوقف، وخالف بعضهم فحسبها 400 كالتاء المبسوطة.
                </li>
                <li>
                  <strong>الألف المقصورة (ى):</strong> تُحسب في الراجح 10 (كالياء) بحسب صورتها ورسمها،
                  وبعضهم يحسبها 1 كالألف بحسب صوتها.
                </li>
                <li>
                  <strong>الحرف المشدد (الشدة):</strong> في الرسم الإملائي يُحسب حرفاً واحداً، أما في
                  الوزن العروضي الصوتي فيُحسب حرفين.
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-xs font-mono text-foreground/30 pt-6">
            // تم برمجة هذا المحرك الحسابي المتقدم بعناية لتوثيق التراث العلمي واللغوي العربي.
          </div>
        </div>
      </div>
    </div>
  );
}
