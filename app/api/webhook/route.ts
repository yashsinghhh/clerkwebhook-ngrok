// app/api/webhook/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload);

  const wh = new Webhook(process.env.WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400
    })
  }

  const eventType = evt.type;

  try {
    switch (eventType) {
      case 'user.created': {
        const { id, email_addresses, username, first_name, last_name, image_url } = evt.data;
        
        const { error } = await supabase
          .from('users')
          .insert({
            clerk_id: id,
            email: email_addresses[0]?.email_address,
            username: username || null,
            first_name: first_name || null,
            last_name: last_name || null,
            image_url: image_url || null,
          });

        if (error) throw error;
        break;
      }

      case 'user.updated': {
        const { id, email_addresses, username, first_name, last_name, image_url } = evt.data;
        
        const { error } = await supabase
          .from('users')
          .update({
            email: email_addresses[0]?.email_address,
            username: username || null,
            first_name: first_name || null,
            last_name: last_name || null,
            image_url: image_url || null,
            updated_at: new Date().toISOString()
          })
          .eq('clerk_id', id);

        if (error) throw error;
        break;
      }

      case 'session.created': {
        const { user_id } = evt.data;
        
        const { error } = await supabase
          .from('users')
          .update({
            last_signed_in: new Date().toISOString()
          })
          .eq('clerk_id', user_id);

        if (error) throw error;
        break;
      }
    }

    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Webhook processing failed', { status: 400 });
  }
}