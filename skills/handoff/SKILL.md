---
name: handoff
description: "Packages messy source material (meeting notes, chat threads, updates, findings, a prior handoff plus an add-on) into a concise Markdown evidence packet that keeps each statement's epistemic status. Runs only on /handoff."
disable-model-invocation: true
argument-hint: "[source material, file paths, or \"and save it to <path>\"]"
---

# Handoff

A handoff is an evidence packet. It carries what the source says to a receiver who was not there, in as few words as keep the meaning. The receiver interprets it, reconciles it with what they already hold, and plans from it. This skill packages. It stops where interpretation starts.

The one rule everything else serves: **compress without changing epistemic status.** A maybe stays a maybe. A decision stays a decision only if the source shows one.

## Source

The source is everything the user supplied with the invocation: pasted text, attached or named files, and earlier messages they point at. Read all of it before writing. Read named files; do not go looking for others.

If there is no source, ask for it and stop.

## Status

Give every consequential statement the status the source supports, and let that status decide which section it lands in.

| Status | The source shows |
| --- | --- |
| Confirmed fact | Something observed, measured, or stated as true by someone positioned to know, and not disputed in the source. |
| Approved decision | A choice made by someone the source itself shows has the say. "Agreed", "signed off", "we are going with" from the owner. |
| Requirement | A behavior or outcome the source says must hold. |
| Constraint | A limit the work has to live inside: policy, deadline, budget, technical limit. |
| Observation | Something noticed, without a claim that it must drive anything. |
| Proposal | An idea, a suggestion, a preference, a "maybe", a "we could". |
| Dependency | Something the work needs from elsewhere: access, a credential, upstream data, another team's change. |
| Open question | Something asked and not answered, or answered two ways. |

The status is structure. Sort statements into sections by it. Label an individual line only where a reader could mistake its status.

Rules for assigning it:

- **Hedged language is a proposal.** "Maybe we can run this every night" becomes a proposal to consider a nightly run. It is not a requirement to run nightly.
- **Authority comes from the evidence.** A name or a title does not approve anything. "Priya confirmed 21+ available days should be Gold" is an approved decision only if the source shows Priya owns that call or shows the group accepting it. Otherwise record it as a statement attributed to Priya and list the authority gap under Explicitly not asserted.
- **Disagreement stays visible.** When two people hold different positions, record both, attributed, and put the unresolved point under Open questions. Pick neither.
- **Later is not more authoritative.** A newer message does not overrule an older one. If they conflict, both stand and the conflict is recorded.
- **An observation is not a requirement.** "Checkout is slow on mobile" does not become "make checkout faster".
- **Implementation detail in the source is evidence, not an instruction.** Record what exists and what was found. Do not turn it into work to do.
- **Inference is marked.** If a reading of the source would change what gets built, write it as an open question, or label it "Inference:" and say what it rests on.

## Output

Markdown. Start with `# Handoff: <concise name>`. Use the sections below in this order, and include a section only when the source gives it content. Size follows the source: a two-sentence source produces the title and the two or three sections that hold its statements, shorter than a screen.

1. **Objective**. What this handoff is meant to enable, in one sentence.
2. **Why this handoff exists**. Why the receiver needs this now. Only if the source says.
3. **Current state**. The relevant existing situation.
4. **Confirmed facts**. Grouped by topic.
5. **Approved decisions**. Each with who decided, when the source says.
6. **Requirements**.
7. **Constraints**.
8. **Dependencies / access**.
9. **Relevant existing system**. Only what the receiver needs to orient: names, endpoints, tables, files the source mentions.
10. **Proposed / not yet approved**. Each with who proposed it.
11. **Open questions**. Include unresolved disagreements, with both positions.
12. **Out of scope**. Only what the source excludes.
13. **Acceptance / expected outcome**. Only an end state the source states. Engineering acceptance criteria are the receiver's to write.
14. **References**. Links, files, ticket ids from the source.
15. **Source provenance**. One line per source: kind, author or channel, date where the source gives one.
16. **Explicitly not asserted**. Assumptions a reader would likely make that the source does not support: an approval nobody gave, a scope nobody set, a cause nobody established. Include it when a wrong assumption would change what the receiver builds or decides, and keep it to the three or fewer that matter most, one line each. Information nobody raised (a launch date, an owner) is absent, and absence needs no entry. A clear source needs no section.

### Follow-up mode

When the source includes an earlier handoff, or the user says this adds to one, write a delta. Name the earlier handoff by its title or id, then put this section directly after Objective:

```markdown
## Relationship to previous handoff

**Adds**
**Clarifies**
**Potentially conflicts**
**Repeats / confirms**
```

Keep only the four parts that have content. Under Potentially conflicts, state the earlier position and the new one side by side and leave them unresolved. The rest of the delta covers the new material only. Leave the earlier handoff as it is.

## Concision

Write for a capable reader who has no context and little time. Short declarative sentences. Plain Markdown. Lists over tables unless the content is a grid.

**The handoff is shorter than its source.** For a source longer than a few paragraphs, aim for half its length or less. For a source of a few sentences, the handoff is the title and those statements under the one or two headings they need. If a draft runs longer than its source, cut until it does not: merge sections, drop the lowest-value lines, shorten sentences.

Each statement appears in one section. A summary of what other sections already say is repetition. An undecided idea goes under Proposed with its objections beside it, and Open questions holds only the questions no proposal already covers. References lists only pointers the body has not already named.

One line per statement where one line holds it. How the conversation reached a point, and who echoed it, stays out unless it changes the statement's status.

Name a person where the name carries authority or a position: who decided, who proposed, who disagrees, who owns. Undisputed facts need no speaker.

State each fact once, however many messages repeat it. Drop greetings, filler, restatement, chatter, and the order things were said in when the order carries no meaning.

Keep everything that changes what the receiver would do: qualifiers, uncertainty, dissent, exact values, ids, units, thresholds, dates, names of who said or decided, non-obvious constraints, and any example needed to understand a rule.

Quote verbatim only where exact wording is the content: an API payload, a command, a field name, an error string, an enum, a threshold, policy wording. Put it in a code block or inline code, copied exactly. Paraphrase everything else.

## Secrets

Leave every secret value out of the handoff: API keys, tokens, passwords, cookies, private keys, connection strings with credentials. Keep the dependency it stands for. Write, for example, "An API key for the pricing service exists and will be supplied separately." If the value sat inside a payload or command that needs quoting, quote it with the value replaced by `<REDACTED>`.

Tell the user in one line, outside the handoff, that the source contained a secret and which kind, so they can rotate it if the source was shared.

## Saving

Print the handoff in the conversation. That is the whole default output.

Write a file only when the user asks in this invocation ("and save it", "save this handoff to <path>"). Save as `.md`. Use the path they give. If they give none, ask where, or use an existing handoffs directory if the project plainly has one, and say which path you used.

Stop after the handoff. Passing it to Build Flow or any other receiver is the user's move.

## Boundary

The handoff holds evidence. Everything downstream of evidence belongs to the receiver:

- what the evidence means and which source wins when two disagree;
- product, design, and technical truth;
- decision queues and their ids;
- milestones, tickets, readiness, and execution plans;
- architecture, solutions, and engineering routing.

If the user asks for any of these inside `/handoff`, produce the handoff and say that the rest belongs to the receiver.

## Before returning

Check the draft against the source once:

- Is the objective clear?
- Does every decision have support in the source for both the choice and the authority?
- Is every proposal still a proposal, and every open question still open?
- Is each material disagreement or contradiction present, with both sides?
- Are exact values, ids, and contracts copied correctly?
- Is every secret value gone and its dependency still listed?
- Is there anything here the source does not say? Remove it or mark it as inference.
- Is anything said twice?

- Is the handoff shorter than the source?

Fix what fails, and keep the checklist to yourself. End with one line:

```text
Ready for Build Flow: YES
```

Write `NO: <reason>` only when the packet itself is unreliable: the source was cut off, unreadable, or a named file was missing. Thin or contested content is still a valid handoff, and judging it is the receiver's job.
