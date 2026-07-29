import React from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import Footer from '@/pages/modules/Footer';
import { getTermsAndConditionsClasses } from '@/styles/modules/termsAndConditionsStyles';

const TermsAndConditions = () => {
  const { theme } = useThemeStore();
  const classes = getTermsAndConditionsClasses(theme);

  return (
    <div className={classes.container}>
      <main className={classes.mainContent}>
        <h1 className={classes.title}>Terms and Conditions</h1>

        <section>
          <h2 className={classes.sectionTitle}>1. Introduction</h2>
          <p className={classes.paragraph}>
            Welcome to BidBazaar! These Terms and Conditions ("Terms") govern your access to and use of the BidBazaar website, mobile applications, and services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
          </p>
        </section>

        <section>
          <h2 className={classes.sectionTitle}>2. Acceptance of Terms</h2>
          <p className={classes.paragraph}>
            You affirm that you are at least 18 years of age and are fully able and competent to enter into the terms, conditions, obligations, affirmations, representations, and warranties set forth in these Terms, and to abide by and comply with these Terms.
          </p>
        </section>

        <section>
          <h2 className={classes.sectionTitle}>3. User Registration</h2>
          <p className={classes.paragraph}>
            To access certain features of the Service, you may be required to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your password and for any activities or actions under your account.
          </p>
        </section>

        <section>
          <h2 className={classes.sectionTitle}>4. Bidding and Buying</h2>
          <ul className={classes.list}>
            <li className={classes.listItem}>All bids are binding. Once a bid is placed, it cannot be retracted except in limited circumstances as outlined in our <Link to="/buyers-protection-page" className={classes.link}>Buyer Protection Policy</Link>.</li>
            <li className={classes.listItem}>The highest bidder at the end of the auction wins the item.</li>
            <li className={classes.listItem}>Payment must be made within a specified timeframe after the auction ends. Failure to do so may result in the cancellation of the sale and a negative impact on your account.</li>
          </ul>
        </section>

        <section>
          <h2 className={classes.sectionTitle}>5. Selling</h2>
          <ul className={classes.list}>
            <li className={classes.listItem}>Sellers must accurately describe items and provide clear images.</li>
            <li className={classes.listItem}>Sellers are responsible for shipping items promptly after receiving payment.</li>
            <li className={classes.listItem}>BidBazaar charges a commission fee on successful sales. Details are available in our <Link to="/fees" className={classes.link}>Fee Structure</Link>.</li>
          </ul>
        </section>

        <section>
          <h2 className={classes.sectionTitle}>6. Fees and Payments</h2>
          <p className={classes.paragraph}>
            BidBazaar may charge fees for certain services, such as listing fees or final value fees. All fees are clearly disclosed. You are responsible for paying all fees and applicable taxes associated with your use of the Service.
          </p>
        </section>

        <section>
          <h2 className={classes.sectionTitle}>7. Prohibited Conduct</h2>
          <p className={classes.paragraph}>
            You agree not to engage in any conduct that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable. This includes, but is not limited to, fraudulent bidding, manipulating auction prices, or posting inappropriate content.
          </p>
        </section>

        <section>
          <h2 className={classes.sectionTitle}>8. Intellectual Property</h2>
          <p className={classes.paragraph}>
            All content on BidBazaar, including text, graphics, logos, images, and software, is the property of BidBazaar or its content suppliers and protected by intellectual property laws.
          </p>
        </section>

        <section>
          <h2 className={classes.sectionTitle}>9. Disclaimers</h2>
          <p className={classes.paragraph}>
            The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. BidBazaar does not guarantee the accuracy, completeness, or reliability of any content or information provided through the Service.
          </p>
        </section>

        <section>
          <h2 className={classes.sectionTitle}>10. Limitation of Liability</h2>
          <p className={classes.paragraph}>
            In no event shall BidBazaar be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.
          </p>
        </section>

        <section>
          <h2 className={classes.sectionTitle}>11. Governing Law</h2>
          <p className={classes.paragraph}>
            These Terms shall be governed and construed in accordance with the laws of [Your Country/State], without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className={classes.sectionTitle}>12. Changes to Terms</h2>
          <p className={classes.paragraph}>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
          </p>
        </section>

        <section>
          <h2 className={classes.sectionTitle}>13. Contact Information</h2>
          <p className={classes.paragraph}>
            If you have any questions about these Terms, please contact us at <a href="mailto:support@bidbazaar.com" className={classes.link}>support@bidbazaar.com</a>.
          </p>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;