import fs from 'fs-extra';
import handlebars from 'handlebars';
import path from 'path';
import YAML from 'yaml';

const TEMPLATES_DIR = path.resolve(__dirname, '../templates/agent');
const COMPOSE_TEMPLATE_PATH = path.resolve(__dirname, '../templates/composeService.hbs');
const DOCKER_COMPOSE_PATH = path.resolve(__dirname, '../docker-compose.yml');

handlebars.registerHelper('json', (ctx) => JSON.stringify(ctx, null, 2));

export async function scaffoldAgentFromApi({
  agentId,
  activityName,
  llm,
  prompt,
  description,
  createdBy,
  systemRole
}: any) {
  const agentDir = path.resolve(__dirname, `../agents/${agentId}`);
  const finalActivityName = activityName || `run${capitalize(agentId)}`;
  const metadata = { description, languageModel: llm, createdBy };

  if (await fs.pathExists(agentDir)) {
    throw new Error(`Agent folder already exists: ${agentId}`);
  }

  await fs.mkdirp(agentDir);

  const context = {
    agentId,
    activityName: finalActivityName,
    llm,
    prompt,
    systemRole,
    description,
    metadata
  };

  const files = await fs.readdir(TEMPLATES_DIR);
  for (const file of files) {
    if (!file.endsWith('.hbs')) continue;
    const templatePath = path.join(TEMPLATES_DIR, file);
    const compiled = handlebars.compile(await fs.readFile(templatePath, 'utf-8'));
    const output = compiled(context);
    await fs.writeFile(path.join(agentDir, file.replace('.hbs', '')), output);
  }

  // Add to docker-compose.yml if not present
  const composeRaw = await fs.readFile(DOCKER_COMPOSE_PATH, 'utf8');
  const composeDoc = YAML.parseDocument(composeRaw);
  if (!composeDoc.hasIn(['services', agentId])) {
    const serviceTemplate = await fs.readFile(COMPOSE_TEMPLATE_PATH, 'utf8');
    const renderedService = handlebars.compile(serviceTemplate)({ agentId });
    const serviceYaml = YAML.parseDocument(renderedService).toJSON();
    composeDoc.setIn(['services', agentId], serviceYaml[agentId]);
    await fs.writeFile(DOCKER_COMPOSE_PATH, composeDoc.toString(), 'utf8');
    console.log(`🧩 Added "${agentId}" to docker-compose.yml`);
  }

  return { agentId, activityName: finalActivityName };
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
