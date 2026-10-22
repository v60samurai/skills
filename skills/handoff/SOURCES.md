# Granola meetings and images

Step 1 of `SKILL.md` reads this when the source includes a Granola meeting or any image. Step 8 comes back to Storing images.

## Granola meetings

A Granola meeting reaches you through the Granola MCP tools: `list_meetings` or `query_granola_meetings` to find it, `get_meetings` to read it (up to 10 ids per call), and `get_meeting_attachment` for its screenshots and photos.

1. **Find each meeting the user names**, by title, date or link. *Checkpoint: every named meeting has an id, or the user has been told which one could not be found.*
2. **Read it with `get_meetings`.** A meeting gives the note creator's private notes, Granola's AI summary, the attendees, and an `<attachments>` list with a description of each screenshot. *Checkpoint: the notes, the summary and the attachment list of every meeting have been read to the end.*
3. **Read the images** the attachment list shows to be material, under Images below.

The free Granola plan sets three limits, and each is written into the handoff:

- **No transcript.** `get_meeting_transcript` is unavailable on the free plan. The notes and the summary are the whole record, and both can leave out what was said. A detail the receiver would need that neither carries is an open question. Use the transcript when the tool returns one.
- **The last 30 days.** Older meetings cannot be fetched. Ask the user to paste the notes from the Granola app. When they are not supplied, list the meeting under `## Missing source material` with the statements that depend on it.
- **No folders.** Folder listing needs a paid plan. Find meetings by title or date.

How a meeting's content is classified:

- **The AI summary is machine-written.** Attribute what comes only from it to "the Granola summary". Its headings, such as "Next steps" or "Decisions", are the summary's framing, and a decision still needs the authority evidence `SKILL.md` asks for.
- **The private notes are the note creator's words.** Attribute them to the note creator, who may not be the user.
- **Source provenance** gets one line per meeting: its title, date, id, note creator, and which parts were read (notes, summary, attachments, transcript).

## Images

An image is **material** when it shows something the text does not carry: a screen or UI state, a chart and its values, a table or schema, code, an error, a diagram or whiteboard. Granola's attachment descriptions lose layout, values and small text, so view a material image itself. Leave out a near-duplicate of an image already kept, and any image Granola marks with an `image_quality_notice`.

### Capturing an image

Capture means getting the image's file path on screen, so step 8 can copy it.

- **A Granola attachment.** Call `get_meeting_attachment` with one `attachment_id` per call. Claude Code saves the full-size image and prints `[Image: source: <path>, ...]` beside it. That path is the file. One attachment per call keeps each path paired with its attachment id.
- **An image the user pasted or attached.** Use the path the host shows for it. T3 Code keeps pasted images in its attachments directory.
- **An image file the user named.** Its path is the file.

Then check what the image shows for secrets, under the Secrets rule in `SKILL.md`: a token or key on screen, a URL carrying a key, a password field with its value showing. An image that shows one stays out of the assets folder. The handoff carries what it shows with the value redacted, its Images entry says `not stored: shows a secret`, and the one-line secret notice goes beside the receipt.

An image is **not stored** when no path appears, because the host keeps it only in the conversation, or when it shows a secret. Its content still goes into statements. An image that could not be viewed at all is missing source material: list it under `## Missing source material` with the statements that depend on it, and set `Evidence complete: NO` when what it shows could change what gets built.

*Checkpoint: every material image has a file path on screen, or is marked not stored with the reason.*

### Writing images into the handoff

Each image gets an E-id, `E1` onward, in the order the handoff first cites it.

- **What an image shows** is written as statements in the sections their types name, citing the image: `- S12. The schema change log has no column for the schedule type. (E2)`. The receiver may never open the image, so every material value, label and state seen in it goes into a statement.
- **`## Images`** is the section before `## Source provenance` in Part D. Like provenance, it lists sources, so its entries carry E-ids and no S-ids. One entry per image: the E-id, the relative path, the sha256, the source with its date or capture time, a few words naming the image, and the image embedded so a reader that renders Markdown shows it.

```markdown
## Images

- E1. `20261007-114500-refund-export-assets/E1-export-dialog.png`, sha256 `4be1c9...` (all 64 characters). Granola meeting "Refund export review", 2026-10-07, screenshot `9f2c...`, captured 11:58 UTC. The export dialog with its column picker open.
  ![E1](20261007-114500-refund-export-assets/E1-export-dialog.png)
- E2. Not stored: the host showed no file path. Pasted in this invocation. The refund report schema in the warehouse console.
```

### Storing images

Step 8 does this before writing the handoff file, outside inline mode.

1. Create `<Handoff id>-assets/` beside the handoff file. Naming it by Handoff id keeps the links working when an intake handoff is later filed into a spec, because the Handoff id never changes.
2. Copy each captured file to `E<n>-<slug>.<ext>`, with the slug rule from `FILE.md` applied to the image's name. The same image captured twice is stored once, under its first E-id.
3. Run `file` on each copy to confirm it is an image, and `shasum -a 256` for the hash in its Images entry.

The assets folder follows the handoff's append-only rule: never edited, renamed or deleted once written. In inline mode nothing is stored, and each Images entry reads `not stored (inline)`.

*Checkpoint: every E-id marked stored has a file in the assets folder whose hash matches its entry.*
