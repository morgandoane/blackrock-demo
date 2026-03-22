# Context, Composition, Commitment

## A BCI-First Interaction Protocol

### Morgan Doane · Blackrock Neurotech · March 2026

---

## The Problem: Inherited Metaphors

Every digital interface in use today is built on metaphors borrowed from the physical world. The keyboard descends from the 1873 Sholes & Glidden typewriter — a machine designed around the mechanical constraint of typebars that jammed if adjacent keys were struck in quick succession. The button descends from a spring-loaded electrical switch — a physical object that moves when pressed and closes a circuit. The dashboard descends from the board mounted at the front of a horse-drawn carriage to block mud from being dashed at the driver.

These aren't just visual holdovers. They encode a deep assumption about what interaction _is_: a human body using its hands to manipulate discrete physical objects, one action at a time. Don Norman's foundational interaction design framework — affordances, signifiers, mapping, feedback — is grounded entirely in this model: a physical actor in a physical world.

The metaphors fossilized into infrastructure. HTML, the language of every interface on the web, is constructed from these same primitives: `<button>`, `<input>`, `<form>`, `<select>`, `<textarea>`. The interaction vocabulary of the entire internet assumes a user who points, clicks, types, and submits — with their fingers, one discrete action at a time.

These metaphors are sticky. They persist long after the constraints that created them have disappeared. And they persist in BCI. Today's brain-computer interfaces largely route decoded neural signals into the same inherited interaction paradigms: letter-selection grids, on-screen keyboards, cursor-driven point-and-click. The input changed. The interaction model didn't. We replaced the finger with a neural signal and left everything above it untouched.

The question is not how to make these metaphors faster. The question is what replaces them when the foundational constraint — ten fingers, one character at a time — no longer applies.

---

## The Protocol: Context, Composition, Commitment

Context, Composition, and Commitment is a three-layer interaction model designed for a world where intent flows directly from the brain, interpreted by AI, without passing through the bottleneck of fingers, keyboards, buttons, or screens.

### Context

**What it is:** The system maintains a continuous, ambient model of the user's situation — who they're communicating with, what conversations are active, where they are, what time it is, what they're doing, what happened recently. This context layer runs passively and requires zero user effort.

**What it replaces:** App launches, navigation, conversation selection, menu browsing — every step where the user tells the machine _what they're trying to do before they do it._ In the current paradigm, context is reconstructed from scratch every time the user opens an app. In this model, context is persistent and shared between the user and the system.

**How it works with BCI and AI:** An implanted device like Blackrock's Utah Array provides continuous neural signal. That signal exists in a broader context: the user's communication history, their location and movement patterns, the time of day, their calendar, their routines. An AI model fuses these streams — neural, environmental, historical — into a live situational model. The system doesn't wait for a command. It maintains awareness of what's likely relevant _right now._

This is where persistent memory and agentic AI become essential. Modern AI systems can maintain long-running context across sessions — not just what the user said five minutes ago, but patterns accumulated over weeks and months: who they message most, what time they manage medications, how they prefer to phrase things, which actions they've historically confirmed without hesitation and which they deliberate over. The context layer isn't built fresh each session. It's a living model of the user that deepens over time.

Critically, context also determines _which tools are relevant._ Modern AI agents operate through tool calling — the ability to select and invoke external capabilities (send a message, adjust a thermostat, query a medical record, place an order) based on the situation. In a conventional interface, the user selects the tool by opening an app. In this model, the AI selects the tool based on intent and context. The user doesn't think "open the messaging app." They think about Sarah, and the system — drawing on context — understands that the relevant tool is messaging, the relevant thread is Sarah's, and the relevant moment is now. The app, as a concept, dissolves. What remains is a library of tools that the AI invokes on the user's behalf, routed by intent rather than navigation.

**How it extends into AR/VR and world modeling:** In an AR context, the context layer integrates what the user is _seeing and attending to._ Vision models can identify objects, people, and environments in real time. If the user is looking at a person they know, the system's context model incorporates that — the relevant conversation thread, recent interactions, social context. If they're in a kitchen, the context shifts toward recipes, timers, grocery lists. The world itself becomes part of the input. Context is no longer something the user provides by tapping through menus. It's something the system _reads from the situation_ — neural state, physical environment, and history, fused together.

---

### Composition

**What it is:** The user forms an intention — something to say, something to do, something to create. The system captures the semantic shape of that intention from neural signal and collaboratively drafts a concrete output: a message, a command, an action. The draft is fluid and alive. It resolves on screen not character by character, but in meaning-chunks — tokens, phrases, whole propositions emerging and taking shape. If the user's intent shifts or the draft feels wrong, the system reads that friction and adjusts. The user steers. The AI drafts. They converge.

**What it replaces:** Keyboards, text input, character-by-character composition, dictation, autocomplete, cursor-based editing — every mechanism that assumes language is produced sequentially through a low-bandwidth output channel. In the current paradigm, the user translates their thought into words, their words into characters, their characters into finger movements, and the machine reconstructs meaning at the other end. Composition collapses that pipeline. Intent maps to meaning directly.

**How it works with BCI and AI:** Blackrock's intracortical arrays record from populations of neurons in motor and premotor cortex. Research has demonstrated that attempted speech, imagined handwriting, and even inner speech produce decodable neural patterns. Current speech BCIs already use AI language models as a critical pipeline component — recurrent neural networks decode phoneme or character probabilities from neural signal, and language models correct errors and produce coherent output. The Composition layer extends this paradigm. Rather than using the language model as a post-hoc error corrector, it becomes a _collaborative partner_ — interpreting intent-level signal and generating draft output that the user refines through ongoing neural feedback. The AI isn't transcribing. It's co-authoring.

Composition is also where tool use becomes tangible. When the user's intent is an action rather than an utterance — refill a prescription, adjust the thermostat, send money to a friend — the agentic system selects the appropriate tool, populates it with context, and drafts the action for the user to review. The user doesn't navigate a pharmacy app, locate the prescription, and tap "refill." The system, having identified the intent and selected the tool, presents a composed action: _"Refill lisinopril 10mg, CVS on Main St, insurance applied."_ The user steers if something is wrong — wrong dosage, wrong pharmacy — and the draft adjusts. This is a collapse of interfaces: every app, every service, every API becomes a tool the AI can call, and the user's only interaction is with the composed result, not the tool's native interface.

The correction mechanism matters. At current decoder accuracy levels (76-97.5% depending on vocabulary size and system), errors are inevitable. Current systems treat correction as an editing problem — move a cursor, delete characters, retype. Composition treats correction as a _dialogue._ The system presents its draft. The user's neural response — markers of error detection, alignment, satisfaction, or friction — tells the system whether to hold, adjust, or revise. Research into error-related negativity and neural markers of decision confidence suggests this feedback channel is viable, though the precise interaction design remains an open research and prototyping question.

**How it extends into AR/VR and world modeling:** Composition is not limited to text. In an AR/VR context, the user might compose a spatial action — rearranging objects, navigating an environment, sketching an idea, manipulating a 3D model. The same principle applies: the system interprets intent-level neural signal and drafts a concrete action in the world, which the user steers and refines. Vision models and world models provide the spatial understanding necessary for the AI to propose meaningful actions. The user thinks _"move that over there"_ — the system, grounded in its understanding of the visual scene, proposes the specific movement. The user confirms, adjusts, or redirects. Composition generalizes from language to any domain where intent needs to become action.

---

### Commitment

**What it is:** The draft is ready. The action is about to become real — a message sent, a command executed, a decision made. The system requires a distinct signal of deliberate intention before acting. Not a button press. Not a tap. A sustained, directed quality of attention that the system recognizes as _"I mean this."_ The threshold of this commitment signal scales proportionally to the stakes of the action.

**What it replaces:** The send button. The confirm dialog. The "are you sure?" popup. Every discrete, binary, finger-initiated authorization mechanism. In the current paradigm, commitment is modeled as a physical act — press a button, and the action fires. The stakes of the action are irrelevant to the mechanism; dismissing a notification and authorizing a financial transaction require the same interaction: tap. Commitment replaces this with a _proportional_ model where the friction is calibrated to the consequence.

This becomes especially important when AI agents are calling tools on the user's behalf. An agentic system with access to messaging, finance, health records, and home automation has real power to act in the world. The commitment layer is what keeps that power accountable to the user. The agent proposes. The user commits. The threshold of commitment scales to match the irreversibility and consequence of what the tool is about to do. Without this layer, an agentic BCI system is either dangerously autonomous or paralyzingly cautious. Commitment is the mechanism that lets it be _appropriately_ autonomous — trusted for routine actions, gated for consequential ones.

**The spectrum of commitment:**

- **Low stakes** (adjust lighting, play music, navigate): The system acts on intent with minimal or no confirmation. Correction is cheap and immediate. If the wrong song plays, the user redirects and the cost is near zero.
- **Medium stakes** (send a casual message, set a reminder, place a routine order): The system drafts and presents. The user's sustained attentional focus — a brief, directed intentional state held for a short window — signals confirmation. This is the commitment bar: a visual representation of the user's focus building until the system has sufficient confidence to act.
- **High stakes** (financial transactions, medical decisions, irreversible actions): The system deliberately reintroduces friction. A longer sustained commitment window. Possibly a secondary confirmation channel — a trained neural "signature," a specific cognitive pattern the user has established as their personal authorization. The system is designed to _resist_ acting until the evidence of deliberate intent is unambiguous.

**How it works with BCI and AI:** The commitment layer relies on the AI's ability to classify the user's neural state along a spectrum from passive awareness to active engagement to deliberate intention. This is not speculative — neural correlates of decision confidence, motor preparation, and sustained attention are well-documented in the literature. The design challenge is calibrating the threshold: sensitive enough that commitment doesn't feel effortful, robust enough that the system doesn't act on idle thought. The AI also plays a role in _classifying the stakes_ of any given action, drawing on context to determine what level of commitment is appropriate. Sending a routine reply to a known contact is different from sending a message to someone new, which is different from authorizing a payment — and the system should know the difference without being told.

**How it extends into AR/VR and world modeling:** In an immersive environment, commitment becomes spatial and embodied. The user might commit to an action by directing sustained attention toward a specific object or location in their visual field — not pointing at it with a finger or a controller, but _attending to it with intent._ Vision models identify the target of attention. The AI disambiguates between looking, considering, and deciding. The commitment signal might also incorporate environmental context: committing to unlock a door when you're standing in front of it carries a different weight than the same action from across the room. The world model participates in the commitment assessment.

---

## Why the Sequence Matters

Context, Composition, and Commitment are not three features. They are a _sequence_ — an interaction arc that replaces the discrete, atomic, command-and-response model inherited from the era of physical manipulation.

In the old model, every interaction is a transaction: the user initiates an explicit action, the system responds. There is no shared understanding. There is no gradient. The machine is either waiting for a command or executing one. The user bears the entire burden of translation — from intent to words to characters to finger movements — and the system offers no help until the input is complete.

In this model, the system is a _partner in the interaction from the beginning._ Context means the system already understands the situation before the user acts. Composition means the user's raw intent is shaped collaboratively, not translated alone. Commitment means the authorization to act is proportional, embodied, and continuous — not a binary button press bolted on at the end.

The sequence also embodies a gradient of control. In the Context phase, the system leads — it surfaces what's relevant without being asked. In Composition, the system and user are co-equal — the AI drafts, the user steers, they converge. In Commitment, the user leads — the system waits for deliberate, sustained intention before acting. The balance of agency shifts across the arc, from machine-initiated to human-authorized. This is the rider and the horse: the horse navigates the path, the rider takes the reins when it matters.

The sequence also implies a structural consequence: the collapse of the app as an organizing concept. Today, tools are organized into applications, each with its own interface, its own navigation, its own input paradigms. The user's job is to select the right app, navigate to the right screen, and provide the right input — all before the actual task begins. With Context, Composition, and Commitment, the agentic AI selects the tool based on intent. The user never sees the app. They experience a single, continuous interaction surface where context flows in, composition takes shape, and commitment deploys the result — whether that result is a text message, a thermostat adjustment, a prescription refill, or a financial transfer. The tools are still there, underneath. But the user's relationship is with the protocol, not the application. Interfaces don't get better. They get _unnecessary._

---

## Why This Is a Protocol, Not a Product

Context, Composition, and Commitment is not a design for a single application. It is a general interaction protocol — a replacement for the point-and-click, type-and-submit paradigm that can be applied across any domain where a human being is trying to do something through a machine.

- **Communication:** Composing and sending messages without keyboards or dictation.
- **Environmental control:** Managing a home, a wheelchair, a workspace through intent rather than switches and apps.
- **Health management:** Monitoring, reporting symptoms, managing medication through a system that shares the user's medical context and acts on their behalf with appropriate safeguards.
- **Creative work:** Drafting, sketching, designing, composing music — any domain where the gap between imagination and output is currently bottlenecked by hands.
- **Navigation and mobility:** Moving through physical and virtual spaces through intention and attention rather than joysticks, controllers, or gaze-tracking grids.

The protocol is device-agnostic. It works with an implanted array like Blackrock's Utah Array at the high end of signal fidelity. It could work — with more AI interpretation and a wider margin of uncertainty — with less invasive systems as the technology matures. The AI's role scales inversely with signal quality: the noisier the input, the more interpretive work the model does. The interaction model stays the same.

The protocol is also tool-agnostic. Any capability that can be expressed as a callable tool — and the trajectory of modern AI is toward making virtually everything a callable tool — can be routed through Context, Composition, and Commitment. Messaging APIs, smart home protocols, health record systems, financial services, navigation, media, accessibility hardware — these all become tools in a shared library that the agentic layer selects and invokes based on the user's intent and context. The protocol doesn't need to know what the tool is. It provides the interaction structure — surface the situation, compose the action collaboratively, and gate deployment with proportional commitment — regardless of what's being done. New tools plug in without requiring new interfaces. The protocol absorbs them.

---

## What Remains to Be Designed

This is a framework, not a finished system. The open questions are significant and are the right problems for a prototyping engineer to work on:

- **Correction dynamics in Composition:** What does the feedback loop between user and AI actually feel like at different error rates? How fast does the system need to respond to corrective neural signals before the experience breaks down? What's the threshold where collaborative drafting stops feeling like partnership and starts feeling like fighting the machine?
- **Commitment calibration:** How long does sustained attention need to hold before the system should act? How does that threshold adapt to individual users? How do you prevent commitment fatigue — the equivalent of alert fatigue in current interfaces — where the user habituates to the confirmation mechanism?
- **Graceful degradation:** When the neural signal quality drops — due to fatigue, electrode drift, or disease progression — how does the system communicate its reduced confidence to the user? How does the interaction change without breaking?
- **Stakes classification:** How does the AI determine the stakes of a given action? How much of that classification is contextual, how much is learned from the individual user, and how much needs to be explicitly defined?

These are prototyping questions — best answered by building, testing, and iterating, not by theorizing. The framework provides the structure. The details live in the prototype.

---

## Git Workflow (for AI agents)

This repo runs on **Windows with PowerShell**. PowerShell is not bash. Follow these rules when committing and pushing:

### Shell constraints

- **No `&&` chaining.** PowerShell does not support `&&` as a command separator. Run `git add` and `git commit` as **separate sequential Shell calls**.
- **No heredoc (`<<'EOF'`).** PowerShell does not support bash-style heredocs. Pass the commit message directly with `-m` flags.
- **Multi-paragraph messages:** Use one `-m` flag for the subject line and a second `-m` flag for the body. Do not try to embed newlines with `\n` or heredoc syntax.

### Commit sequence

1. `git add -A` (or stage specific files)
2. `git commit -m "Subject line" -m "Body paragraph with more detail."`
3. `git status` to verify
4. `git push` only when the user explicitly asks

### Commit message style

- **Subject line:** Imperative mood, ~50 chars. Describe what the commit does, not what you did. Example: `Add prescription refill interaction with two-stage commitment bar`
- **Body:** One paragraph summarizing the meaningful changes. Focus on what changed and why, not file-by-file narration. Keep it under ~300 chars.
- Do not list every file touched. The diff does that.
- Do not prefix with `feat:`, `fix:`, etc. — this repo does not use conventional commits.
