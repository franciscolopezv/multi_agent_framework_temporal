import fs from 'fs-extra';
import handlebars from 'handlebars';
import path from 'path';
import YAML from 'yaml';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';


const TEMPLATES_DIR = path.resolve(__dirname, '../templates/agent');

const argv = yargs(hideBin(process.argv))
  .scriptName('generate-agent')
  .usage('$0 <agentId> [options]')
  .command('<agentId>', 'Agent name (used for folder and taskQueue)')
  .option('activity', {
    alias: 'a',
    type: 'string',
    description: 'Activity function name (default: run<AgentName>)',
  })
  .option('llm', {
    type: 'string',
    default: 'gpt-4',
    description: 'Language model used by this agent',
  })
  .option('systemRole', {
    type: 'string',
    default: 'You are an AI assistant agent.',
    description: 'System role prompt for the LLM',
  })
  .option('prompt', {
    type: 'string',
    default: 'Answer the user input: {{input}}',
    description: 'User prompt template (use {{input}})',
  })
  .option('endpoint', {
    type: 'string',
    description: 'Optional external endpoint to call instead of OpenAI',
  })
  .option('createdBy', {
    alias: 'c',
    type: 'string',
    default: 'system',
    description: 'Creator of the agent (email, username)',
  })
  .demandCommand(1)
  .help()
  .argv as any;

// Register JSON helper for metadata embedding
handlebars.registerHelper('json', (context) => JSON.stringify(context, null, 2));

async function generateAgent({
  agentId,
  activityName,
  llm,
  systemRole,
  prompt,
  endpoint,
  createdBy
}: {
  agentId: string;
  activityName: string;
  llm: string;
  systemRole: string;
  prompt: string;
  endpoint?: string;
  createdBy: string;
}) {
  const agentDir = path.resolve(__dirname, `../agents/${agentId}`);

  if (fs.existsSync(agentDir)) {
    console.log(`⚠️ Agent "${agentId}" already exists.`);
    return;
  }

  await fs.mkdirp(agentDir);

  const context = {
    agentId,
    activityName,
    llm,
    systemRole,
    prompt,
    endpoint,
    metadata: {
      languageModel: llm,
      createdBy
    }
  };

  const files = await fs.readdir(TEMPLATES_DIR);

  for (const file of files) {
    if (!file.endsWith('.hbs')) continue;

    const templatePath = path.join(TEMPLATES_DIR, file);
    const destFile = file.replace(/\.hbs$/, '');
    const outputPath = path.join(agentDir, destFile);

    const templateSrc = await fs.readFile(templatePath, 'utf-8');
    const compiled = handlebars.compile(templateSrc);
    const result = compiled(context);

    await fs.writeFile(outputPath, result, 'utf-8');
  }

  await appendToDockerCompose(agentId);

  console.log(`✅ Agent "${agentId}" scaffolded at ./agents/${agentId}`);
}

const agentId = argv._[0];
const activityName = argv.activity || `run${agentId.charAt(0).toUpperCase()}${agentId.slice(1)}`;

if (!agentId) {
  console.log('❌ Usage: ts-node scripts/generate-agent.ts <agentId> [options]');
  process.exit(1);
}

generateAgent({
  agentId,
  activityName,
  llm: argv.llm,
  systemRole: argv.systemRole,
  prompt: argv.prompt,
  endpoint: argv.endpoint,
  createdBy: argv.createdBy
});

async function appendToDockerCompose(agentId: string) {
    const composePath = path.resolve(__dirname, '../docker-compose.yml');
    const composeServicePath = path.resolve(__dirname, '../templates/composeService.hbs');
  
    const rawCompose = await fs.readFile(composePath, 'utf8');
    const composeDoc = YAML.parseDocument(rawCompose);
  
    if (composeDoc.hasIn(['services', agentId])) {
      console.log(`ℹ️ "${agentId}" already exists in docker-compose.yml`);
      return;
    }
  
    const template = await fs.readFile(composeServicePath, 'utf-8');
    const rendered = handlebars.compile(template)({ agentId });
  
    // Parse rendered YAML and insert it
    const serviceFragment = YAML.parseDocument(rendered).toJSON();
    composeDoc.setIn(['services', agentId], serviceFragment[agentId]);
  
    await fs.writeFile(composePath, composeDoc.toString(), 'utf8');
    console.log(`🧩 Added "${agentId}" to docker-compose.yml`);
  }