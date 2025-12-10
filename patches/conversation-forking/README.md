# Conversation Forking Feature

This patch adds conversation forking/branching functionality to open-coreui, similar to LibreChat's implementation.

## Known Limitations

- **Multi-model conversations**: Fork button does not appear when multiple models are used in a conversation (MultiResponseMessages component). This would require additional modifications to `MultiResponseMessages.svelte`.

## What it does

- Adds a **Fork** button to both user messages and assistant responses
- When clicked, creates a new conversation that:
  - Copies all messages up to and including the fork point
  - Creates an independent conversation with its own history
  - Navigates to the new forked conversation automatically
- The original conversation remains unchanged

## How it works

The feature leverages the existing tree-based message structure (messages have `parentId` and `childrenIds`). When forking:

1. All messages from the fork point back to the root are collected
2. New UUIDs are generated for each message in the forked conversation
3. Parent-child relationships are remapped to use the new UUIDs
4. A new chat is created with the forked history
5. The user is navigated to the new chat

## Files modified

- `Messages.svelte` - Added `forkConversation` function
- `Message.svelte` - Pass `forkConversation` to child components
- `UserMessage.svelte` - Added Fork button UI
- `ResponseMessage.svelte` - Added Fork button UI and prop
- `Fork.svelte` - New icon component (place in `src/lib/components/icons/`)

## How to apply

### Option 1: Apply the patch file

After initializing the submodule:

```bash
cd backend
git apply ../patches/conversation-forking/conversation-forking.patch
```

### Option 2: Copy files directly

Copy the modified `.svelte` files to their respective locations:

```bash
cp patches/conversation-forking/Fork.svelte backend/svelte-frontend/src/lib/components/icons/
cp patches/conversation-forking/Messages.svelte backend/svelte-frontend/src/lib/components/chat/
cp patches/conversation-forking/Message.svelte backend/svelte-frontend/src/lib/components/chat/Messages/
cp patches/conversation-forking/UserMessage.svelte backend/svelte-frontend/src/lib/components/chat/Messages/
cp patches/conversation-forking/ResponseMessage.svelte backend/svelte-frontend/src/lib/components/chat/Messages/
```

## Usage

After applying the changes and rebuilding:

1. Open any conversation
2. Hover over any message (user or assistant)
3. Click the **Fork** icon (share/branch icon)
4. A new conversation will be created with all context up to that point
5. Continue the conversation from the fork point

## Fork icon

The fork button uses a reusable `Fork.svelte` icon component located in `src/lib/components/icons/`. This follows the existing pattern of icon components in the codebase (e.g., `Sparkles.svelte`, `Share.svelte`).
