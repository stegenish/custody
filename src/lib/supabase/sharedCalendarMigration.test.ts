import { readFileSync } from "fs";
import path from "path";

const migrationSql = readFileSync(
  path.join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260515190000_shared_calendar.sql"
  ),
  "utf8"
);

function getFunctionSql(functionName: string): string {
  const start = migrationSql.indexOf(
    `create or replace function public.${functionName}`
  );
  const nextFunction = migrationSql.indexOf(
    "create or replace function public.",
    start + 1
  );

  if (start === -1) {
    throw new Error(`Missing function ${functionName}`);
  }

  return migrationSql.slice(
    start,
    nextFunction === -1 ? migrationSql.length : nextFunction
  );
}

function getPolicySql(policyName: string): string {
  const start = migrationSql.indexOf(`create policy "${policyName}"`);
  const nextPolicy = migrationSql.indexOf("create policy ", start + 1);

  if (start === -1) {
    throw new Error(`Missing policy ${policyName}`);
  }

  return migrationSql.slice(
    start,
    nextPolicy === -1 ? migrationSql.length : nextPolicy
  );
}

describe("shared calendar migration proposal comment guards", () => {
  it.each([
    ["send_draft_proposal", "sent"],
    ["reset_draft_proposal", "withdrawn"],
    ["withdraw_active_proposal", "withdrawn"],
    ["discard_active_proposal", "withdrawn"],
    ["reject_active_proposal", "rejected"],
    ["counter_active_proposal", "countered"],
    ["accept_active_proposal", "accepted"],
  ])("%s records a %s proposal status event", (functionName, status) => {
    const functionSql = getFunctionSql(functionName);

    expect(functionSql).toMatch(/insert into public\.proposal_status_events/);
    expect(functionSql).toMatch(new RegExp(`'${status}'`));
  });

  it("supports discarding active proposals without restoring a draft", () => {
    const functionSql = getFunctionSql("discard_active_proposal");

    expect(functionSql).toMatch(/status\s*=\s*'withdrawn'/);
    expect(functionSql).not.toMatch(/status\s*=\s*'draft'/);
    expect(functionSql).not.toMatch(/Parent already has a draft proposal/);
  });

  it("only creates proposal comments on draft or sent proposals", () => {
    expect(getFunctionSql("create_proposal_comment")).toMatch(
      /status\s+in\s+\('draft',\s*'sent'\)/
    );
  });

  it.each(["update_proposal_comment", "delete_proposal_comment"])(
    "does not require %s to target an active proposal",
    (functionName) => {
      expect(getFunctionSql(functionName)).not.toMatch(/status\s*=\s*'sent'/);
    }
  );

  it("only permits direct proposal comment inserts on draft or sent proposals", () => {
    expect(getPolicySql("parents can create proposal comments")).toMatch(
      /status\s+in\s+\('draft',\s*'sent'\)/
    );
  });

  it("does not require direct proposal comment updates to target active proposals", () => {
    expect(getPolicySql("comment authors can update active comments")).not.toMatch(
      /status\s*=\s*'sent'/
    );
  });

  it("allows parents to read proposal comments outside active proposals", () => {
    expect(getPolicySql("parents can read proposal comments")).not.toMatch(
      /status\s*=\s*'sent'/
    );
  });
});
