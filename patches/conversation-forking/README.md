# Conversation Forking Feature

This patch adds conversation forking/branching functionality to open-coreui, similar to LibreChat's implementation.

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

The fork button uses a "share" style icon that represents branching:
- SVG path: `M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z`
