import amqp from 'amqplib';
import config from '../config/config.js';

let channel,connection;

export async function connectRabbitMQ(){
    try {
        connection=await amqp.connect(config.RABBITMQ_URL);
        channel=await connection.createChannel();
        console.log("Connected to RabbitMQ");
    } catch (error) {
        console.error("Failed to connect to RabbitMQ, retrying in 5s...",error);
        await new Promise(res => setTimeout(res, 5000));
        return connectRabbitMQ();
    }
}

export  async function publishToQueue(queueName, data){
    await channel.assertQueue(queueName,{durable:true});
    await channel.sendToQueue(queueName,Buffer.from(JSON.stringify(data)));
    console.log("Message sent to queue:",queueName);
    
}


export async function subscribeToQueue(queueName, callback){
    await channel.assertQueue(queueName,{durable:true});

    channel.consume(queueName,async(msg)=>{
        if(msg!==null){
            try {
                const data=JSON.parse(msg.content.toString());
                await callback(data);
                channel.ack(msg);
            } catch (error) {
                console.error(`[RabbitMQ] Error processing message from queue ${queueName}:`, error);
                // Nack the message so it can be requeued or dead-lettered
                channel.nack(msg, false, false); 
            }
        }
    });
}