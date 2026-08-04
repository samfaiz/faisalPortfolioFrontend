/**
 * Project 04 — Alert triage copilot with RAG.
 *
 * Introduces retrieval-augmented generation properly: a runbook corpus, a
 * vector store, and — the part everyone skips — a check that the model's
 * citations actually point at retrieved text rather than at its own training
 * memory. The teaching point is that RAG does not make a model truthful; it
 * gives you something to verify the model against.
 *
 * Code blocks use String.raw so Windows paths and regexes stay literal. No
 * backtick may appear inside a String.raw block — where Python needs to emit a
 * Markdown backtick, chr(96) is used.
 */
import type { ProjectGuide } from "@/lib/guides/types";

export const p04: ProjectGuide = {
  slug: "alert-triage-copilot-rag",
  projectId: 4,
  intro:
    "<p>You are going to build a triage assistant that does not answer from memory. It answers from <b>your runbooks</b> — retrieving the relevant procedure, grounding its verdict in that retrieved text, and citing the exact passage behind every recommendation. When no runbook covers the alert, it says so instead of inventing a plausible-sounding procedure.</p>" +
    "<p>This is retrieval-augmented generation, and the reason it matters is narrow and important: a base model knows a generic version of security that is often subtly wrong for your environment, and it states that generic version with total confidence. RAG replaces “what the model vaguely remembers about credential-stuffing” with “what <i>your</i> credential-stuffing runbook actually says” — and, critically, it gives you a source to check the answer against. The retrieval is not the clever part. The <b>verification that the answer came from the retrieval</b> is.</p>" +
    "<p>The corpus can be your own notes from <a href=\"/soc-prep\">/soc-prep</a> — which is the neatest way to see the whole portfolio connect. Your L1 revision becomes the knowledge base your AI assistant reasons over.</p>",
  dataset: {
    name: "A small runbook corpus — your /soc-prep notes, or the starter set in the guide",
    note:
      "<p><b>Primary: your own runbooks.</b> Any Markdown or text you have written about how to handle specific alerts — brute force, phishing, suspicious PowerShell, impossible travel. Ten short documents is plenty to see RAG work and to see it fail honestly.</p>" +
      "<p><b>If you have none yet:</b> step 1 gives you five realistic runbook stubs to write to disk, enough to build and test the whole pipeline. Replace them with real ones later; the code does not change.</p>" +
      "<p>Everything is local. The runbooks never leave your machine, which is the point — a runbook corpus often contains environment detail you would not paste into a hosted API.</p>",
  },
  glossary: [
    {
      term: "RAG (retrieval-augmented generation)",
      plain:
        "Before the model answers, you search a document store for passages relevant to the question and put them in the prompt. The model answers from those passages rather than from its training. “The model reads the runbook before replying.”",
    },
    {
      term: "Embedding",
      plain:
        "A list of numbers that captures the meaning of a piece of text, so that two passages about the same thing sit close together even if they share no words. It is how you search by meaning instead of by keyword.",
    },
    {
      term: "Vector store",
      plain:
        "A database built to hold embeddings and answer “which stored passages are closest in meaning to this query?” quickly. Chroma is the one used here; it runs in-process with no server.",
    },
    {
      term: "Chunk",
      plain:
        "A runbook is too long to embed as one unit, so you split it into passages of a few hundred words. Each chunk is embedded and retrieved independently. Chunking well is most of what makes RAG work.",
    },
    {
      term: "Top-k retrieval",
      plain:
        "You ask the store for the k passages nearest the query — k is usually 3 to 5. Too few and you miss the relevant one; too many and you drown the model in noise.",
    },
    {
      term: "Grounding (here)",
      plain:
        "Every claim the model makes must quote a retrieved chunk, and a validator checks the quote really appears in what was retrieved. A citation the model invented is rejected exactly as in project 01.",
    },
  ],
  before: [
    "<b>Project 01 finished.</b> The grounding validator returns here, pointed at retrieved chunks instead of a raw log line.",
    "<b>Module 09 read.</b> This project is that module's triage loop with the retrieve step built out properly.",
    "Python 3.11+, Ollama running, and an embedding model — step 2 pulls <code>nomic-embed-text</code>.",
    "About 10 short runbook documents. Bring your own, or write the starter set from step 1.",
  ],
  steps: [
    {
      title: "Set up, and assemble a runbook corpus",
      time: "20 min",
      why: "RAG is only as good as the corpus. Starting with a few honest, specific runbooks beats a hundred generic ones, and it makes the retrieval quality visible when you test it.",
      body:
        "<p>Make a project folder and a <code>runbooks/</code> directory. Drop in your own notes as <code>.md</code> files, or write the five starter stubs below — each is a real alert type with a real, if short, procedure.</p>" +
        "<p>Two packages beyond the standard library: <code>chromadb</code> for the vector store and <code>ollama</code> for both embedding and generation.</p>",
      commands: [
        {
          lang: "powershell",
          where: "Windows",
          code: String.raw`mkdir triage-copilot; cd triage-copilot
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install ollama chromadb pydantic rich
mkdir runbooks`,
        },
        {
          lang: "bash",
          where: "macOS / Linux",
          code: String.raw`mkdir triage-copilot && cd triage-copilot
python3 -m venv .venv
source .venv/bin/activate
pip install ollama chromadb pydantic rich
mkdir runbooks`,
        },
        {
          lang: "python",
          label: "seed_runbooks.py — run once if you have no runbooks of your own",
          code: String.raw`import pathlib

RUNBOOKS = {
    "brute-force-4625.md": """# Runbook: Repeated failed logons (Event ID 4625)

## When this fires
A single source account or IP accumulates many 4625 (failed logon)
events in a short window.

## Triage steps
1. Count failures per account and per source IP over the window.
2. Check whether a SUCCESS (4624) followed the failures for the same
   account. Failures then a success is the signal that matters -
   the attacker guessed the password.
3. Confirm the source IP is not a misconfigured service or a user's
   new device before treating it as an attack.

## Escalate when
A 4624 success follows the failures from the same source, OR the
source IP is external and previously unseen for this account.

## Do not
Do not lock the account automatically. A misconfigured service
mailbox will lock a real user out repeatedly.
""",
    "office-spawns-powershell.md": """# Runbook: Office application spawned PowerShell

## When this fires
winword.exe, excel.exe or outlook.exe is the parent process of
powershell.exe, cmd.exe or wscript.exe.

## Triage steps
1. Decode the command line if it is base64 or encoded (-enc).
2. Determine the parent document's origin - email attachment or a
   trusted internal share.
3. Check whether the command reached the network after spawning.

## Escalate when
The command line is encoded AND made an outbound connection, OR the
document arrived as an email attachment from an external sender.

## Known benign
Finance runs a macro workbook weekly that shells out. Change ref
CHG-7742. Confirm host and schedule before dismissing on this basis.
""",
    "impossible-travel.md": """# Runbook: Impossible travel sign-in

## When this fires
Two successful sign-ins for one account from locations too far apart
to travel between in the elapsed time.

## Triage steps
1. Confirm both sign-ins actually succeeded, not just attempted.
2. Rule out a VPN or corporate proxy that relocates the apparent
   source - the single most common false positive here.
3. Check the second location against the user's known travel and
   whether the device is registered.

## Escalate when
Neither location is explained by VPN or known travel, especially if
the second sign-in used a new device or triggered MFA fatigue.
""",
    "suspicious-service-creation.md": """# Runbook: New service created (Event ID 7045)

## When this fires
A new Windows service is installed, especially with a random name or
a binary path in a temp or user-writable directory.

## Triage steps
1. Inspect the service binary path. System32 is normal; AppData,
   Temp or ProgramData is suspicious.
2. Check the account that created the service and whether change
   management explains it.
3. Hash the binary and look up its reputation.

## Escalate when
The binary is in a user-writable path, has no reputation, and no
change record explains the installation.
""",
    "data-exfil-large-upload.md": """# Runbook: Large outbound data transfer

## When this fires
An endpoint uploads an unusually large volume to an external
destination relative to its own baseline.

## Triage steps
1. Identify the destination - known cloud backup, or unrecognised?
2. Compare the volume to the host's normal outbound baseline.
3. Identify the process responsible for the transfer.

## Escalate when
The destination is unrecognised AND the process is not a sanctioned
backup or sync client, particularly outside business hours.
""",
}

out = pathlib.Path("runbooks")
for name, text in RUNBOOKS.items():
    (out / name).write_text(text, encoding="utf-8")
print(f"wrote {len(RUNBOOKS)} runbooks to runbooks/")`,
        },
      ],
      expect:
        "<p>A <code>runbooks/</code> folder with your Markdown files in it. Quality over quantity — five specific runbooks teach RAG better than fifty vague ones.</p>",
      expectCode: "wrote 5 runbooks to runbooks/",
      fixes: [
        {
          problem: "chromadb fails to install with a build error",
          cause:
            "Older Python or a missing build toolchain. Chroma pulls compiled dependencies.",
          fix: "Use Python 3.11+ and upgrade pip first: <code>python -m pip install --upgrade pip</code>. On Windows, the prebuilt wheels usually just work once pip is current.",
        },
      ],
    },
    {
      title: "Chunk the runbooks — the step that decides retrieval quality",
      time: "30 min",
      why: "Retrieval returns chunks, not documents. Chunk too big and you retrieve a whole runbook when you needed one paragraph; too small and you sever the step from its condition. Most RAG failures are chunking failures.",
      body:
        "<p>Split each runbook on its Markdown headings, so a chunk is a coherent section — “Triage steps”, “Escalate when” — rather than an arbitrary character window. This keeps the meaning of each chunk intact, which is what makes it retrievable for the right query.</p>" +
        "<p>Attach the source filename and heading to every chunk as metadata. You will need them for citations, and a citation to “brute-force-4625.md → Escalate when” is far more useful than a citation to chunk 47.</p>",
      commands: [
        {
          lang: "python",
          label: "chunk.py",
          code: String.raw`import pathlib, re

def chunk_markdown(path: pathlib.Path) -> list[dict]:
    """Split on headings. Each chunk keeps its source and heading so the
    citation is human-readable, not a chunk index."""
    text = path.read_text(encoding="utf-8")
    parts = re.split(r"^(#{1,3} .+)$", text, flags=re.MULTILINE)

    chunks, heading = [], path.stem
    # re.split keeps the delimiters, so parts alternates text / heading
    buf = parts[0]
    i = 1
    while i < len(parts):
        heading = parts[i].lstrip("# ").strip()
        body = parts[i + 1] if i + 1 < len(parts) else ""
        content = f"{heading}\n{body}".strip()
        if content:
            chunks.append({
                "id": f"{path.stem}::{heading}",
                "text": content,
                "source": path.name,
                "heading": heading,
            })
        i += 2
    return chunks

all_chunks = []
for f in sorted(pathlib.Path("runbooks").glob("*.md")):
    all_chunks.extend(chunk_markdown(f))

print(f"{len(all_chunks)} chunks from "
      f"{len(list(pathlib.Path('runbooks').glob('*.md')))} runbooks")
for c in all_chunks[:3]:
    print(f"  {c['id']}  ({len(c['text'])} chars)")`,
        },
      ],
      expect:
        "<p>A few dozen chunks, each tagged with its source file and heading. Read a couple — if a chunk does not make sense on its own, it will not retrieve well, and this is the moment to fix the chunking rather than after you have embedded everything.</p>",
      expectCode: String.raw`23 chunks from 5 runbooks
  brute-force-4625.md::When this fires  (118 chars)
  brute-force-4625.md::Triage steps  (334 chars)
  brute-force-4625.md::Escalate when  (152 chars)`,
      fixes: [
        {
          problem: "One runbook becomes a single giant chunk",
          cause: "It has no Markdown headings, so there was nothing to split on.",
          fix: "Add headings to the runbook, or fall back to splitting on blank lines. Heading-based chunking needs headings; that is the trade for readable citations.",
        },
      ],
    },
    {
      title: "Embed and store the chunks in Chroma",
      time: "20 min",
      why: "This is the one-time indexing pass. Every chunk becomes a vector, stored so that retrieval is a fast nearest-neighbour lookup rather than a scan.",
      body:
        "<p>Pull the embedding model, then embed each chunk and add it to a persistent Chroma collection. <code>nomic-embed-text</code> is small, local, and good enough for this; the embedding never leaves your machine.</p>",
      commands: [
        {
          lang: "bash",
          label: "One-time model pull",
          code: String.raw`ollama pull nomic-embed-text`,
        },
        {
          lang: "python",
          label: "index.py",
          code: String.raw`import chromadb, ollama
from chunk import all_chunks   # or paste the chunking inline

client = chromadb.PersistentClient(path="./chroma")
# Cosine space matches how nomic embeddings are meant to be compared
col = client.get_or_create_collection(
    "runbooks", metadata={"hnsw:space": "cosine"}
)

def embed(text: str) -> list[float]:
    return ollama.embeddings(model="nomic-embed-text", prompt=text)["embedding"]

# Idempotent: upsert by stable id so re-running does not duplicate
col.upsert(
    ids=[c["id"] for c in all_chunks],
    embeddings=[embed(c["text"]) for c in all_chunks],
    documents=[c["text"] for c in all_chunks],
    metadatas=[{"source": c["source"], "heading": c["heading"]}
               for c in all_chunks],
)
print(f"indexed {col.count()} chunks")`,
        },
      ],
      expect:
        "<p>A <code>./chroma</code> directory on disk and a confirmed chunk count. Because the upsert keys on a stable id, you can re-run this any time you change a runbook without creating duplicates.</p>",
      expectCode: "indexed 23 chunks",
      fixes: [
        {
          problem: "ollama.embeddings raises a model-not-found error",
          cause: "The embedding model is separate from your chat model and must be pulled.",
          fix: "<code>ollama pull nomic-embed-text</code>. It is about 275 MB and only needed once.",
        },
      ],
    },
    {
      title: "Test retrieval on its own — before adding the model",
      time: "25 min",
      why: "The single most common RAG mistake is trusting retrieval you never checked. If the wrong chunks come back, the model cannot save you — it will ground confidently in the wrong runbook. Test this in isolation first.",
      body:
        "<p>Write a query, retrieve the top chunks, and <b>read them</b>. Does the relevant runbook come back for a query it should match? Does an unrelated query correctly return nothing useful? This is retrieval quality, and it is a property you measure with your eyes before you automate anything.</p>",
      commands: [
        {
          lang: "python",
          label: "retrieve.py",
          code: String.raw`import chromadb, ollama

client = chromadb.PersistentClient(path="./chroma")
col = client.get_collection("runbooks")

def retrieve(query: str, k: int = 3) -> list[dict]:
    qvec = ollama.embeddings(model="nomic-embed-text", prompt=query)["embedding"]
    res = col.query(query_embeddings=[qvec], n_results=k)
    return [
        {"text": d, "source": m["source"], "heading": m["heading"],
         "distance": dist}
        for d, m, dist in zip(res["documents"][0],
                              res["metadatas"][0],
                              res["distances"][0])
    ]

for q in ["Word launched an encoded powershell command",
          "user logged in from two countries an hour apart",
          "what is the capital of France"]:
    print(f"\nQUERY: {q}")
    for r in retrieve(q):
        print(f"  {r['distance']:.3f}  {r['source']} -> {r['heading']}")`,
        },
      ],
      expect:
        "<p>The Office/PowerShell query should surface <code>office-spawns-powershell.md</code>; the travel query should surface <code>impossible-travel.md</code>; and the France query should return chunks with visibly larger distances — nothing is actually relevant, and the distance shows it. That last case is what step 7 turns into a refusal.</p>",
      expectCode: String.raw`QUERY: Word launched an encoded powershell command
  0.271  office-spawns-powershell.md -> Triage steps
  0.318  office-spawns-powershell.md -> When this fires
  0.402  office-spawns-powershell.md -> Escalate when

QUERY: what is the capital of France
  0.611  data-exfil-large-upload.md -> When this fires
  0.634  brute-force-4625.md -> When this fires`,
      fixes: [
        {
          problem: "The right runbook does not come back at all",
          cause:
            "Usually a chunking or vocabulary mismatch — your query uses words the runbook never does.",
          fix: "Read the chunk that <i>should</i> have matched. If it describes the alert in entirely different words, that is a real retrieval limit — add an alias line to the runbook, or accept that keyword-only phrasing needs hybrid search (a stretch goal).",
        },
        {
          problem: "Every distance is roughly the same",
          cause: "The corpus is tiny and homogeneous, or the query is vague.",
          fix: "Expected with five runbooks. The gap between relevant and irrelevant widens as the corpus grows and as queries get specific. The France query's larger distances are the signal you care about.",
        },
      ],
    },
    {
      title: "Ground the verdict in retrieved chunks",
      time: "35 min",
      why: "Now the model enters — and its instructions are strict. It answers only from the retrieved chunks, and every claim cites the chunk it came from. This is module 09's output contract with the evidence sourced from retrieval.",
      body:
        "<p>Assemble the retrieved chunks into a numbered context block, hand them to the model with the alert, and require a citation — by chunk number — for every recommendation. The system prompt forbids answering from general knowledge, which is the instruction that makes RAG mean something.</p>",
      commands: [
        {
          lang: "python",
          label: "copilot.py — the schema and the grounded call",
          code: String.raw`from typing import Literal
from pydantic import BaseModel, Field
import json, ollama

class Citation(BaseModel):
    claim: str = Field(description="What you are asserting")
    chunk: int = Field(description="Which numbered context chunk supports it")
    quote: str = Field(description="The exact sentence from that chunk")

class Verdict(BaseModel):
    verdict: Literal["benign", "suspicious", "malicious",
                     "insufficient_evidence", "no_runbook_match"]
    confidence: float = Field(ge=0.0, le=1.0)
    recommended_steps: list[str]
    citations: list[Citation]

SYSTEM = """You are a triage assistant. You answer ONLY from the numbered
RUNBOOK CONTEXT provided. You do not use general security knowledge.

Every recommended step and the verdict must be supported by a citation.
Each citation's quote MUST be copied exactly from the chunk it names.

If the retrieved context does not actually cover this alert, return
verdict "no_runbook_match" with an empty citations list. Do not answer
from memory when the runbooks are silent."""

def triage(alert: str, chunks: list[dict]) -> Verdict:
    context = "\n\n".join(
        f"[chunk {i}] ({c['source']} -> {c['heading']})\n{c['text']}"
        for i, c in enumerate(chunks)
    )
    resp = ollama.chat(
        model="llama3.1:8b",
        format=Verdict.model_json_schema(),
        options={"temperature": 0},
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user",
             "content": f"RUNBOOK CONTEXT:\n{context}\n\nALERT:\n{alert}"},
        ],
    )
    return Verdict.model_validate_json(resp["message"]["content"])`,
        },
      ],
      expect:
        "<p>A structured verdict whose citations name specific chunks. On the encoded-PowerShell alert you should see it recommend decoding the command line and checking the document origin — because the runbook said so, with a quote to prove it, not because the model happened to know it.</p>",
      fixes: [
        {
          problem: "The model recommends steps that are not in any runbook",
          cause:
            "It is falling back on general knowledge — the exact behaviour the system prompt forbids and the next step catches.",
          fix: "Do not fix it in the prompt alone; the validator in step 6 is the enforcement. But strengthening “ONLY from the context, NEVER from general knowledge” and putting it at the end of the system prompt helps.",
        },
      ],
    },
    {
      title: "Validate that the citations came from retrieval — not memory",
      time: "25 min",
      why: "This is the project's whole reason to exist. A model can name chunk 2 and then quote something chunk 2 never said. Without this check, RAG gives you the comforting appearance of grounding with none of the substance.",
      body:
        "<p>For every citation, confirm the quote is genuinely a substring of the chunk it names. If it is not, the model fabricated a citation — dressed a memory up as a retrieval — and the verdict is rejected, not shown with a footnote.</p>",
      commands: [
        {
          lang: "python",
          label: "copilot.py — the retrieval-grounding validator",
          code: String.raw`class GroundingError(Exception):
    pass

def assert_grounded(v: Verdict, chunks: list[dict]) -> None:
    """Each citation's quote must literally appear in the chunk it cites.
    Whitespace is normalised; the words and order must still match."""
    def norm(s: str) -> str:
        return " ".join(s.split()).lower()

    for i, c in enumerate(v.citations):
        if c.chunk < 0 or c.chunk >= len(chunks):
            raise GroundingError(
                f"citation {i} names chunk {c.chunk}, which was not retrieved"
            )
        haystack = norm(chunks[c.chunk]["text"])
        if norm(c.quote) not in haystack:
            raise GroundingError(
                f"citation {i} quote is not in chunk {c.chunk}.\n"
                f"  claimed: {c.quote!r}\n"
                f"  This is a fabricated citation. Reject the verdict."
            )

try:
    assert_grounded(verdict, retrieved)
    print(f"OK grounded - {len(verdict.citations)} citation(s) verified")
except GroundingError as e:
    print(f"REJECTED\n{e}")`,
        },
      ],
      expect:
        "<p>Either confirmation that every quote checks out against its chunk, or a rejection naming the fabricated one. Both are wins. The rejection is RAG's grounding actually being enforced instead of assumed — the difference between this project and most RAG demos.</p>",
      expectCode: "OK grounded - 3 citation(s) verified",
      fixes: [
        {
          problem: "A quote fails that looks almost identical",
          cause: "The model reworded the runbook — “lock the account” became “locking accounts”. Paraphrase, which the check exists to catch.",
          fix: "Do not loosen the check to accept near-matches. Tighten the prompt: “quote the sentence verbatim, do not rephrase”. A model that cannot quote its own retrieved context is telling you something about itself.",
        },
      ],
    },
    {
      title: "Prove it refuses when no runbook covers the alert",
      time: "15 min",
      why: "The most valuable behaviour and the least tested. A RAG assistant that answers even when retrieval found nothing relevant is worse than no assistant — it launders a guess through the appearance of a source.",
      body:
        "<p>Feed it an alert unlike anything in the corpus and confirm it returns <code>no_runbook_match</code> rather than retrieving the least-irrelevant chunk and answering from that. Add a distance threshold so genuinely poor matches never even reach the model.</p>",
      commands: [
        {
          lang: "python",
          label: "Gate retrieval on distance, then re-run on an unseen alert",
          code: String.raw`UNSEEN = """EventID=5140  A network share object was accessed
  ShareName=\\\\*\\SYSVOL  SubjectUserName=dc-audit  AccessMask=0x1"""

hits = retrieve(UNSEEN, k=3)

# If the nearest chunk is still far, do not even call the model.
THRESHOLD = 0.55   # tune by looking at step 4's distances
if not hits or hits[0]["distance"] > THRESHOLD:
    print("no_runbook_match - nearest chunk too distant, not calling model")
else:
    verdict = triage(UNSEEN, hits)
    print(verdict.verdict)`,
        },
      ],
      expect:
        "<p><code>no_runbook_match</code>, reached either by the distance gate or by the model itself. What you must not see is a confident triage of a SYSVOL access using the brute-force runbook because it was the closest of five bad options.</p>",
      expectCode:
        "no_runbook_match - nearest chunk too distant, not calling model",
      fixes: [
        {
          problem: "It still produces a verdict citing an irrelevant chunk",
          cause: "The distance threshold is too loose, or the model ignored the no-match instruction.",
          fix: "Lower <code>THRESHOLD</code> using the distances you saw in step 4 — the France query's numbers are your calibration. The gate is more reliable than the instruction; use both, but trust the gate.",
        },
      ],
    },
    {
      title: "Measure retrieval — recall@k on a tiny labelled set",
      time: "30 min",
      why: "You cannot improve what you cannot measure, and “the RAG feels good” is not a metric. A handful of labelled queries turns retrieval quality into a number you can defend and improve.",
      body:
        "<p>Write ten queries you know the correct runbook for, then measure how often the right one appears in the top k. This is recall@k, and it is the honest health check for the retrieval half of the system — independent of whatever the model does with what it gets.</p>",
      commands: [
        {
          lang: "python",
          label: "eval_retrieval.py",
          code: String.raw`# (query, the source file that SHOULD be retrieved)
LABELLED = [
    ("failed logins then a success from one IP", "brute-force-4625.md"),
    ("excel started a hidden powershell", "office-spawns-powershell.md"),
    ("signed in from London then Sydney in 40 minutes", "impossible-travel.md"),
    ("a service was installed from a temp folder", "suspicious-service-creation.md"),
    ("huge upload to an unknown host overnight", "data-exfil-large-upload.md"),
    ("brute force against a service account", "brute-force-4625.md"),
    ("macro spawned cmd with an encoded command", "office-spawns-powershell.md"),
    ("VPN makes user look like two locations", "impossible-travel.md"),
    ("random-named service with no signature", "suspicious-service-creation.md"),
    ("data leaving the network to cloud storage", "data-exfil-large-upload.md"),
]

for k in (1, 3):
    hits = sum(
        any(r["source"] == want for r in retrieve(q, k))
        for q, want in LABELLED
    )
    print(f"recall@{k}: {hits}/{len(LABELLED)} = {hits/len(LABELLED):.0%}")`,
        },
      ],
      expect:
        "<p>Two numbers — recall@1 and recall@3. recall@3 should be high on a corpus this clean. The gap between them tells you how much k is doing for you, and any miss points straight at a runbook whose wording does not match how you would describe its alert.</p>",
      expectCode: String.raw`recall@1: 7/10 = 70%
recall@3: 10/10 = 100%`,
      fixes: [
        {
          problem: "recall@3 is well below 100% on the starter set",
          cause: "A query and its runbook share no vocabulary, so embedding similarity is low.",
          fix: "Look at the specific miss. Either the runbook needs a line describing the alert in the words an analyst would use, or you have found the genuine case for hybrid (keyword + vector) retrieval — a legitimate finding to state, and a stretch goal to build.",
        },
      ],
    },
  ],
  after: [
    "Write down your recall@3 and one sentence on the model half: does the grounded verdict match the runbook when retrieval is correct? Those two facts describe the whole system honestly.",
    "Keep the runbooks in git. When you edit one, re-run <code>index.py</code> — the stable-id upsert means it updates in place. This is detection-as-code applied to knowledge.",
    "Point the corpus at your real /soc-prep notes and watch recall change. A larger, messier corpus is the real test, and the honest before/after is worth recording.",
    "Project 09 reuses this retrieval to ground an incident report in past tickets. Project 10 measures whether grounding actually reduced the hallucination rate versus project 01's ungrounded model — the number that justifies all this work.",
  ],
  enterprise: [
    {
      platform: "Microsoft Security Copilot + promptbooks",
      body:
        "<p>Copilot grounds in Sentinel's data automatically, and you can attach your own knowledge via a plugin or a SharePoint corpus. You gain enterprise-scale retrieval and lose the ability to inspect exactly which chunk grounded which claim — the citation transparency you built by hand here. Having built it is what lets you ask Copilot the right question: “show me the source for that recommendation.”</p>",
    },
    {
      platform: "Elastic AI Assistant with a knowledge base",
      body:
        "<p>The closest commercial analogue: you load documents into a knowledge base, it embeds and retrieves them, and it can run against a local model you supply. The architecture is identical to this project, which means the retrieval-quality discipline transfers directly — measure recall on a labelled set before trusting it.</p>",
    },
    {
      platform: "Splunk AI Assistant",
      body:
        "<p>Less of a native RAG story; strongest at SPL generation over your data. The pattern to carry across is that grounding a model in <i>your</i> content beats a bigger model reasoning from generic training — true whether the content is runbooks or your event schema.</p>",
    },
  ],
  cloudApi:
    "<p>A frontier model will follow the grounding instructions more reliably and refuse more cleanly when the runbooks are silent — the two behaviours this project most depends on. But the corpus is the sensitive part: runbooks often encode environment specifics, named systems, and thresholds you would not want to leave your network. The clean split is to <b>keep the vector store and embeddings local</b> and, if you want a stronger model for the generation step, send only the retrieved chunks plus the alert — never the whole corpus. Module 05 is the conversation to have before doing even that, because a retrieved chunk can still contain internal detail.</p>",
};
