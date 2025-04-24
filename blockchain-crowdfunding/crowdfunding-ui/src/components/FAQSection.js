import React, { useState } from "react";
import "../styles/FAQSection.css";

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    { question: "How does DonationTrack work?", answer: "DonationTrack utilizes blockchain technology to ensure transparency in donations. Every transaction is securely recorded." },
    { question: "Is there a fee for using this platform?", answer: "No, our platform is free to use. We aim to connect NGOs and donors seamlessly." },
    { question: "Can I donate using cryptocurrency?", answer: "Yes! We support crypto donations for secure and fast transactions." },
    { question: "How can NGOs sign up?", answer: "NGOs can sign up through our portal by filling out basic details and verification information." },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-section">
      <h2 className="section-title">Frequently Asked Questions</h2>
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div key={index} className="faq-item">
            <button className="faq-question" onClick={() => toggleFAQ(index)}>
              {faq.question}
              <span className="faq-icon">{openIndex === index ? "−" : "+"}</span>
            </button>
            {openIndex === index && <p className="faq-answer">{faq.answer}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQSection;