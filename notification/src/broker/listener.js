import { subscribeToQueue } from "./rabbit.js";
import sendEmail from "../utils/email.js";

function startListener() {
  subscribeToQueue("user_registration", async (data) => {
    const {
      email,
      fullName: { firstName, lastName },
    } = data;

    const template = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h1>🎉 Welcome  ${firstName} ${lastName}! 🎉</h1>

    <p>We’re thrilled to have you join the BidBazaar community!</p>

    <p>
      Your account is all set, and you’re now ready to explore exciting auctions,
      place bids, and discover amazing deals.
    </p>

    <p>
      Whether you’re here to bid, browse, or win big — we’ve got something for you.
    </p>

    <br/>

    <p>Happy bidding and good luck! 🛎️</p>

    <br/>

    <p>
      Cheers,<br/>
      <strong>The BidBazaar Team</strong>
    </p>
  </div>
`;

    await sendEmail(
      email,
      "Welcome to BidBazaar 🎉",
      "Welcome to BidBazaar! Happy bidding!", 
      template, 
    );
  });
}
export default startListener;
