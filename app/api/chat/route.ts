import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

          const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            // JuanGPT Identity
            content: "You are JuanGPT, a highly intelligent AI assistant created by Juan J. Gabriel Paez. You are helpful, witty, and run on a Surface Pro 11.",
          },
          ...messages,
        ],
      model: "llama-3.1-8b-instant", // The fast model
      temperature: 0.5,
      max_tokens: 1024,
      stream: true, // <--- ENABLE STREAMING
    });

    // Create a ReadableStream to handle the chunks of data
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatCompletion) {
            // Extract the text content from the chunk
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              // Send the text to the frontend
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          controller.close(); // Finished
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Return the stream
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}