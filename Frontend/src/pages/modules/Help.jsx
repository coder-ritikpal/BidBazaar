import React, { useState } from 'react';
import { useThemeStore } from '@/store/themeStore';
import Footer from './Footer';
import { getHelpPageClasses } from '@/styles/modules/helpPageStyles';
import { ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { faqs } from '@/data/faqData';

const Help = () => {
  const { theme } = useThemeStore();
  const classes = getHelpPageClasses(theme);
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={classes.container}>
      <main className={classes.mainContent}>
        <div className={classes.headerSection}>
          <h1 className={classes.title}>How can we help?</h1>
          <span className={classes.tag}>Frequently Asked Questions</span>
          <p className={classes.subtitle}>Find answers to common questions about buying and selling.</p>
        </div>

        <div className={classes.faqContainer}>
          {faqs.map((faq, index) => (
            <div key={index} className={classes.faqItem}>
              <button 
                className={classes.questionButton}
                onClick={() => toggleFAQ(index)}
              >
                <span className={classes.questionText}>{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className={classes.icon} />
                ) : (
                  <ChevronDown className={classes.icon} />
                )}
              </button>
              {openIndex === index && (
                <div className={classes.answerContainer}>
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={classes.contactSection}>
          <h2 className={classes.contactTitle}>Still have questions?</h2>
          <p className={classes.contactText}>Can't find the answer you're looking for? Our support team is here to help.</p>
          <a href="mailto:support@bidbazaar.com" className={classes.contactButton}>
            <Mail className="w-5 h-5 mr-2" />
            Contact Support
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Help;