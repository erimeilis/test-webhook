/**
 * Code Examples Generator
 * Generate code snippets for webhook usage
 */

import type { Context } from 'hono'
import type { Bindings, Variables } from '@/types/hono'
import { drizzle } from 'drizzle-orm/d1'
import { webhooks } from '@/lib/db-schema'
import { eq, and } from 'drizzle-orm'

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>

interface CodeExample {
  language: string
  code: string
}

function generateCurl(webhookUrl: string): string {
  return `# POST request with JSON data
curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"event": "test", "data": {"key": "value"}}'

# GET request with query parameters
curl "${webhookUrl}?param1=value1&param2=value2"`
}

function generateJavaScript(webhookUrl: string): string {
  return `// POST request with fetch API
fetch('${webhookUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    event: 'test',
    data: { key: 'value' }
  })
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

// GET request with query parameters
fetch('${webhookUrl}?param1=value1&param2=value2')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`
}

function generateNodeJS(webhookUrl: string): string {
  return `// Using axios (npm install axios)
const axios = require('axios');

// POST request
axios.post('${webhookUrl}', {
  event: 'test',
  data: { key: 'value' }
})
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });

// GET request with query parameters
axios.get('${webhookUrl}', {
  params: {
    param1: 'value1',
    param2: 'value2'
  }
})
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });`
}

function generatePython(webhookUrl: string): string {
  return `# Using requests library (pip install requests)
import requests
import json

# POST request
response = requests.post(
    '${webhookUrl}',
    headers={'Content-Type': 'application/json'},
    json={'event': 'test', 'data': {'key': 'value'}}
)
print(response.json())

# GET request with query parameters
response = requests.get(
    '${webhookUrl}',
    params={'param1': 'value1', 'param2': 'value2'}
)
print(response.json())`
}

function generatePHP(webhookUrl: string): string {
  return `<?php
// POST request with cURL
$ch = curl_init('${webhookUrl}');
$data = json_encode([
    'event' => 'test',
    'data' => ['key' => 'value']
]);

curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

echo $response;

// GET request with query parameters
$url = '${webhookUrl}?' . http_build_query([
    'param1' => 'value1',
    'param2' => 'value2'
]);

$response = file_get_contents($url);
echo $response;
?>`
}

export async function getCodeExamples(c: AppContext) {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const webhookId = c.req.param('id')

    if (!webhookId) {
      return c.json({ error: 'Webhook ID is required' }, 400)
    }

    const db = drizzle(c.env.DB)

    // Verify webhook belongs to user
    const webhook = await db
      .select()
      .from(webhooks)
      .where(and(eq(webhooks.id, webhookId), eq(webhooks.userId, user.id)))
      .get()

    if (!webhook) {
      return c.json({ error: 'Webhook not found' }, 404)
    }

    // Generate webhook URL (use environment or default to localhost for dev)
    const webhookUrl = `http://localhost:5174/w/${webhook.uuid}`

    const examples: CodeExample[] = [
      { language: 'curl', code: generateCurl(webhookUrl) },
      { language: 'javascript', code: generateJavaScript(webhookUrl) },
      { language: 'nodejs', code: generateNodeJS(webhookUrl) },
      { language: 'python', code: generatePython(webhookUrl) },
      { language: 'php', code: generatePHP(webhookUrl) },
    ]

    return c.json({ examples, webhookUrl })
  } catch (error) {
    console.error('Error generating code examples:', error)
    return c.json({ error: 'Failed to generate code examples' }, 500)
  }
}
