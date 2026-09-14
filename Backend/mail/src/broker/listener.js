import { subscribeToQueue } from "./rabbit.js";
import sendEmail from "../utils/email.js";
import { fetchUserDetails } from "../utils/user.js";

function startListener() {
  subscribeToQueue("user_registration", async (data) => {
    const {
      email,
      fullName: { firstName, lastName },
    } = data;

    const template = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h1>🙋‍♂️ Hello Dear  ${firstName} ${lastName}  Welcome 💝❕</h1>

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

  subscribeToQueue("auction_join", async (data) => {
    console.log("[Mail Service] Received auction_join event:", data);
    // Note: Assuming email and name are either provided in the payload or fetched here via user service
    const { email, name = "Bidder", amount, auctionId } = data;
    
    if (!email) return console.warn("[Mail Service] No email provided for auction_join");
    const { amount, auctionId, bidderId } = data;
    const user = await fetchUserDetails(bidderId);
    
    if (!user || !user.email) return console.warn(`[Mail Service] No email resolved for bidderId ${bidderId} on auction_join`);

    const name = user.fullName?.firstName || "Bidder";
    const email = user.email;

    const template = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h1 style="color: #2563eb;">🚀 Bid Successfully Placed!</h1>
    <p>Hello <strong>${name}</strong>,</p>
    <p>You have successfully joined the auction and placed a bid of <strong>Rs. ${amount}</strong>!</p>
    <p>Keep an eye on the auction to make sure you aren't outbid. Good luck!</p>
    <br/>
    <p>Happy bidding! 🛎️</p>
    <p>Cheers,<br/><strong>The BidBazaar Team</strong></p>
  </div>
`;

    await sendEmail(email, "You placed a bid! 🚀", `Your bid of Rs. ${amount} was placed.`, template);
  });

  subscribeToQueue("auction_won", async (data) => {
    console.log("[Mail Service] Received auction_won event:", data);
    const { email, name = "Winner", price, auctionId } = data;
    
    if (!email) return console.warn("[Mail Service] No email provided for auction_won");
    const { price, auctionId, winnerId } = data;
    const user = await fetchUserDetails(winnerId);
    
    if (!user || !user.email) return console.warn(`[Mail Service] No email resolved for winnerId ${winnerId} on auction_won`);

    const name = user.fullName?.firstName || "Winner";
    const email = user.email;

    const template = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h1 style="color: #16a34a;">🎉 Congratulations! You Won!</h1>
    <p>Hello <strong>${name}</strong>,</p>
    <p>Amazing news! You won the auction for <strong>Rs. ${price}</strong>.</p>
    <p>The item has been automatically added to your cart as an unpaid order. Please proceed to checkout within the next 24 hours to secure your item.</p>
    <br/>
    <p>Thank you for using BidBazaar!</p>
    <p>Cheers,<br/><strong>The BidBazaar Team</strong></p>
  </div>
`;

    await sendEmail(email, "Congratulations! You won the auction! 🎉", `You won the auction for Rs. ${price}.`, template);
  });

  subscribeToQueue("order_placed", async (data) => {
    console.log("[Mail Service] Received order_placed event:", data);
    const { email, name = "Customer", amount, orderId } = data;
    
    if (!email) return console.warn("[Mail Service] No email provided for order_placed");
    const { amount, orderId, userId } = data;
    const user = await fetchUserDetails(userId);
    
    if (!user || !user.email) return console.warn(`[Mail Service] No email resolved for userId ${userId} on order_placed`);

    const name = user.fullName?.firstName || "Customer";
    const email = user.email;

    const template = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h1 style="color: #9333ea;">📦 Order Confirmed!</h1>
    <p>Hello <strong>${name}</strong>,</p>
    <p>We've successfully received your payment of <strong>Rs. ${amount}</strong>.</p>
    <p>Your order (ID: ${orderId}) is now confirmed and will be processed for shipping shortly.</p>
    <br/>
    <p>Thank you for shopping with us!</p>
    <p>Cheers,<br/><strong>The BidBazaar Team</strong></p>
  </div>
`;

    await sendEmail(email, "Order Confirmed! 📦", `Your order for Rs. ${amount} has been placed.`, template);
  });

  subscribeToQueue("delivery_confirmed", async (data) => {
    console.log("[Mail Service] Received delivery_confirmed event:", data);
    const { email, name = "User", orderId } = data;
    
    if (!email) return console.warn("[Mail Service] No email provided for delivery_confirmed");
    const { orderId, userId } = data; // Usually we notify the buyer that their delivery is confirmed
    const user = await fetchUserDetails(userId);
    
    if (!user || !user.email) return console.warn(`[Mail Service] No email resolved for userId ${userId} on delivery_confirmed`);

    const name = user.fullName?.firstName || "User";
    const email = user.email;

    const template = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h1 style="color: #0d9488;">✅ Delivery Confirmed!</h1>
    <p>Hello <strong>${name}</strong>,</p>
    <p>Your order (ID: ${orderId}) has been successfully marked as delivered!</p>
    <p>We hope you enjoy your item. If you have any issues, please reach out to our support team.</p>
    <br/>
    <p>Thank you for choosing BidBazaar!</p>
    <p>Cheers,<br/><strong>The BidBazaar Team</strong></p>
  </div>
`;

    await sendEmail(email, "Delivery Confirmed! ✅", `Order ${orderId} has been delivered.`, template);
  });
}
export default startListener;
