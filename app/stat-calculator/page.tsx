// app/stat-calculator/page.tsx
import StatCalculatorForm from '@/components/StatCalculatorForm';
import FeedbackButton from '@/components/FeedbackButton';

export default function StatCalculatorPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>คำนวณสเตตัส</h1>
      <div className="panel" style={{ marginTop: 20, maxWidth: 480 }}>
        <StatCalculatorForm />
      </div>
      <div style={{ marginTop: 20 }}>
        <FeedbackButton pageType="stat_calculator" entityId="formula" />
      </div>
    </main>
  );
}
