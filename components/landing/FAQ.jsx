import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section } from "@/components/landing/Section";
import { faqs } from "@/components/landing/data";

/**
 * FAQ: tiga pasang tanya jawab memakai Accordion dari shadcn/ui.
 * TODO: ganti data asli — daftar FAQ ada di components/landing/data.js
 */
export function FAQ() {
  return (
    <Section id="faq" eyebrow="FAQ" title="Pertanyaan yang sering masuk">
      <Accordion
        type="single"
        collapsible
        defaultValue="faq-0"
        className="max-w-3xl"
      >
        {faqs.map((faq, index) => (
          <AccordionItem key={faq.question} value={`faq-${index}`}>
            <AccordionTrigger className="text-left text-base font-medium text-foreground">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="leading-relaxed text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}

export default FAQ;
