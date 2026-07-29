import React from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import Footer from '@/pages/modules/Footer'; // Assuming Footer is in modules
import { getBuyersProtectionFullPageClasses } from '@/styles/containers/buyersProtectionFullPageStyles';

const BuyersProtectionFullPage = () => {
    const { theme } = useThemeStore();
    const classes = getBuyersProtectionFullPageClasses(theme);

    return (
        <div className={classes.container}>
            <main className={classes.mainContent}>
                <div className={classes.heroSectionLayout}> {/* New wrapper for side-by-side hero */}
                    <section className={classes.heroBannerSection}> {/* Specific banner for hero */}
                        <img
                            src="/images/buyers-protection-banner.png" // Corrected image path
                            alt="BidBazaar Buyers Protection"
                            className={classes.heroBannerImage}
                        />
                    </section>


                </div>

                <section className={classes.policyContentWrapper}>
                    <h2 className={classes.policyTitle}>BidBazaar Buyer's Protection Policy</h2>
                    <p className={classes.policyParagraph}>
                        At BidBazaar, trust is the single most important thing we work on every day. BidBazaar's Buyer Protection guarantees that your payment is safe, objects are quality checked by experts, and all sellers are verified.
                    </p>

                    <h3 className={classes.policySubheading}>Buyers Protection Fee</h3>
                    <p className={classes.policyParagraph}>
                        To maintain the high standards of our Buyers Protection Policy and to cover the operational costs associated with dispute resolution, fraud prevention, and secure payment processing, a small Buyers Protection Fee of <strong>5% +100₹</strong> is applied to each successful transaction. This fee is clearly displayed at checkout and contributes directly to ensuring a safe and reliable marketplace for all BidBazaar users.
                    </p>



                    <h3 className={classes.policySubheading}>What Our Policy Covers:</h3>
                    <ul className={`${classes.policyList} list-disc`}>
                        <li className={classes.policyListItem}><strong>Item Not Received:</strong> If your purchased item does not arrive, you are eligible for a full refund.</li>
                        <li className={classes.policyListItem}><strong>Item Significantly Not as Described:</strong> If the item you receive is materially different from its description or photos on the listing page (e.g., wrong item, damaged, missing major parts), you are covered.</li>
                        <li className={classes.policyListItem}><strong>Fraudulent Listings:</strong> We employ robust measures to detect and prevent fraudulent listings. In the rare event you encounter one, we guarantee a full refund.</li>
                        <li className={classes.policyListItem}><strong>Secure Payment Processing:</strong> All payments on BidBazaar are processed through encrypted and secure gateways to protect your financial information.</li>
                        <li className={classes.policyListItem}><strong>Dispute Resolution:</strong> Our dedicated support team is here to mediate and resolve disputes fairly and efficiently.</li>
                    </ul>

                    <h3 className={classes.policySubheading}>How to Resolve an Issue:</h3>
                    <ol className={`${classes.policyList} list-decimal`}>
                        <li className={classes.policyListItem}><strong>Contact the Seller:</strong> Most issues can be resolved quickly by communicating directly with the seller within 3-5 business days of receiving the item or expected delivery date.</li>
                        <li className={classes.policyListItem}><strong>Open a Dispute:</strong> If you cannot reach a resolution with the seller, you can open a dispute through your BidBazaar account within 14 days of the issue arising.</li>
                        <li className={classes.policyListItem}><strong>BidBazaar Mediation:</strong> Our support team will review your case, request necessary evidence from both parties, and mediate to facilitate a fair outcome. This process typically takes 7-10 business days.</li>
                        <li className={classes.policyListItem}><strong>Resolution:</strong> Depending on the investigation, a full refund, partial refund, or replacement may be issued. Funds are held securely until the dispute is resolved.</li>
                    </ol>

                    <h3 className={classes.policySubheading}>Exclusions:</h3>
                    <p className={classes.policyParagraph}>Our Buyers Protection Policy does not cover:</p>
                    <ul className={`${classes.policyList} list-disc`}>
                        <li className={classes.policyListItem}>Items purchased outside of the BidBazaar platform.</li>
                        <li className={classes.policyListItem}>Buyer's remorse or items that do not fit.</li>
                        <li className={classes.policyListItem}>Items damaged during shipping if the buyer opted out of insured shipping (if applicable).</li>
                        <li className={classes.policyListItem}>Digital goods or services.</li>
                    </ul>

                    <p className={classes.policyParagraph}>For further details and specific conditions, please refer to our <Link to="/terms-of-service" className={classes.policyLink}>Terms of Service</Link> and <Link to="/faq" className={classes.policyLink}>Frequently Asked Questions</Link>.</p>
                    <p className={classes.policyParagraph}>Thank you for choosing BidBazaar for your online auctions!</p>

                </section>
            </main>

            <Footer />
        </div>
    );
};

export default BuyersProtectionFullPage;