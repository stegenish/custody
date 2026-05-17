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
    "create_proposal_comment",
    "update_proposal_comment",
    "delete_proposal_comment",
  ])("requires %s to target an active sent proposal", (functionName) => {
    expect(getFunctionSql(functionName)).toMatch(/status\s*=\s*'sent'/);
  });

  it.each([
    "parents can create proposal comments",
    "comment authors can update active comments",
  ])("requires %s to target active sent proposals", (policyName) => {
    expect(getPolicySql(policyName)).toMatch(/status\s*=\s*'sent'/);
  });

  it("allows parents to read proposal comments outside active proposals", () => {
    expect(getPolicySql("parents can read proposal comments")).not.toMatch(
      /status\s*=\s*'sent'/
    );
  });
});
