
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RETELL_API_KEY = process.env.RETELL_API_KEY;
const RETELL_BASE_URL = 'https://api.retellai.com';

async function fetchRetell(endpoint, options = {}) {
  const response = await fetch(`${RETELL_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${RETELL_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Retell API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}

async function main() {
  console.log('🚀 Creating HOM.ESTATE agent...');
  
  // 1. Create the agent using the existing LLM
  const existingLLMId = 'llm_5dd431d7403668aaaea477d618aa';
  console.log('\n📝 Creating agent...');
  
  try {
    const agent = await fetchRetell('/create-agent', {
      method: 'POST',
      body: JSON.stringify({
        agent_name: 'HOM.ESTATE Asistente',
        language: 'es-ES',
        voice_id: 'retell-Cimo',
        response_engine: {
          type: 'retell-llm',
          llm_id: existingLLMId,
        },
        // We'll add more config later like tools, etc.
      }),
    });
    
    console.log('✅ Agent created!');
    console.log('Agent ID:', agent.agent_id);
    
    // 2. Get Public Key (we need it for the widget)
    console.log('\n🔑 Looking for Public Key...');
    try {
      // Let's try to create a public key if we don't have one
      let publicKey;
      try {
        publicKey = await fetchRetell('/create-public-key', {
          method: 'POST',
        });
      } catch {
        // If create fails, maybe we already have one—let's check by trying to get keys (we need to find the right endpoint)
        // For now, let's tell the user to get it from the dashboard
        publicKey = { key: 'GET_FROM_DASHBOARD' };
      }
      console.log('Public Key:', publicKey);
      
      // 3. Update .env file with Agent ID and Public Key
      console.log('\n📝 Updating .env file...');
      const envPath = path.resolve(__dirname, '../.env');
      let envContent = await fs.readFile(envPath, 'utf8');
      
      envContent = envContent.replace(
        'PUBLIC_RETELL_AGENT_ID=',
        `PUBLIC_RETELL_AGENT_ID=${agent.agent_id}`
      );
      
      if (publicKey.key && publicKey.key !== 'GET_FROM_DASHBOARD') {
        envContent = envContent.replace(
          'PUBLIC_RETELL_PUBLIC_KEY=',
          `PUBLIC_RETELL_PUBLIC_KEY=${publicKey.key}`
        );
      }
      
      await fs.writeFile(envPath, envContent);
      console.log('✅ .env updated!');
      
    } catch (e) {
      console.log('Error with Public Key, please get it from Retell Dashboard:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Error creating agent:', error);
  }
}

main();
