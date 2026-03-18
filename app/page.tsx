import CtaSlide from "@/components/landing/cta-slide";
import FaqSlide from "@/components/landing/faq-slide";
import FeaturesSlide from "@/components/landing/features-slide";
import HeroSlide from "@/components/landing/hero-slide";
import LandingScroll from "@/components/landing/landing-scroll";
import ProblemSlide from "@/components/landing/problem-slide";
import SolutionSlide from "@/components/landing/solution-slide";
import WorkflowSlide from "@/components/landing/workflow-slide";

export default function LandingPage() {
  return (
    <LandingScroll>
      <HeroSlide />
      <ProblemSlide />
      <SolutionSlide />
      <WorkflowSlide />
      <FeaturesSlide />
      <FaqSlide />
      <CtaSlide />
    </LandingScroll>
  );
}
