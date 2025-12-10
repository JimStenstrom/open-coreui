/**
 * Conversation Fork Service
 *
 * Separates domain logic from UI concerns following SOLID principles:
 * - S: Each function has a single responsibility
 * - O: Can be extended without modifying existing code
 * - D: Depends on abstractions (interfaces), not concrete implementations
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES / INTERFACES (Domain Models)
// ============================================================================

export interface Message {
	id: string;
	parentId: string | null;
	childrenIds: string[];
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
	[key: string]: unknown;
}

export interface ChatHistory {
	messages: Record<string, Message>;
	currentId: string;
}

export interface ForkResult {
	history: ChatHistory;
	suggestedTitle: string;
}

// ============================================================================
// PURE DOMAIN LOGIC (No side effects, easily testable)
// ============================================================================

/**
 * Collects all ancestor message IDs from a given message back to root.
 * Pure function - no side effects.
 */
export function collectAncestorChain(
	messages: Record<string, Message>,
	messageId: string
): string[] {
	const chain: string[] = [];
	let current = messages[messageId];

	while (current) {
		chain.unshift(current.id);
		current = current.parentId ? messages[current.parentId] : null;
	}

	return chain;
}

/**
 * Creates a mapping from old message IDs to new UUIDs.
 * Pure function - no side effects.
 */
export function createIdMapping(messageIds: string[]): Record<string, string> {
	const mapping: Record<string, string> = {};
	messageIds.forEach(id => {
		mapping[id] = uuidv4();
	});
	return mapping;
}

/**
 * Remaps a single message with new IDs.
 * Pure function - no side effects.
 */
export function remapMessage(
	originalMsg: Message,
	newId: string,
	idMap: Record<string, string>,
	ancestorChain: string[],
	forkPointId: string
): Message {
	const newParentId = originalMsg.parentId ? idMap[originalMsg.parentId] : null;

	let newChildrenIds: string[] = [];
	if (originalMsg.id !== forkPointId) {
		const childInChain = (originalMsg.childrenIds ?? []).find(
			childId => ancestorChain.includes(childId)
		);
		if (childInChain) {
			newChildrenIds = [idMap[childInChain]];
		}
	}

	return {
		...JSON.parse(JSON.stringify(originalMsg)),
		id: newId,
		parentId: newParentId,
		childrenIds: newChildrenIds
	};
}

/**
 * Creates a forked history from the original.
 * Pure function - main domain logic entry point.
 */
export function createForkedHistory(
	originalHistory: ChatHistory,
	forkPointId: string
): ChatHistory {
	const ancestorChain = collectAncestorChain(originalHistory.messages, forkPointId);
	const idMap = createIdMapping(ancestorChain);

	const forkedMessages: Record<string, Message> = {};

	for (const oldId of ancestorChain) {
		const originalMsg = originalHistory.messages[oldId];
		const newId = idMap[oldId];
		forkedMessages[newId] = remapMessage(
			originalMsg,
			newId,
			idMap,
			ancestorChain,
			forkPointId
		);
	}

	return {
		messages: forkedMessages,
		currentId: idMap[forkPointId]
	};
}

/**
 * Generates a title for the forked conversation.
 * Pure function - presentation logic.
 */
export function generateForkTitle(
	forkedHistory: ChatHistory,
	fallbackTitle: string,
	forkPrefix: string = 'Fork'
): string {
	const firstUserMessage = Object.values(forkedHistory.messages).find(
		m => m.role === 'user'
	);

	if (firstUserMessage?.content) {
		const truncated = firstUserMessage.content.slice(0, 30);
		const ellipsis = firstUserMessage.content.length > 30 ? '...' : '';
		return `${forkPrefix}: ${truncated}${ellipsis}`;
	}

	return `${forkPrefix}: ${fallbackTitle}`;
}

// ============================================================================
// SERVICE CLASS (Orchestrates domain logic with dependencies)
// ============================================================================

/**
 * Dependencies interface - allows for dependency injection and testing
 */
export interface ForkServiceDependencies {
	createChat: (token: string, chat: object, folderId: string | null) => Promise<{ id: string } | null>;
	refreshChatList: () => Promise<void>;
	navigate: (url: string) => Promise<void>;
	showSuccess: (message: string) => void;
	showError: (message: string) => void;
	getToken: () => string;
	translate: (key: string) => string;
}

/**
 * Fork Service - orchestrates the forking process
 * Depends on abstractions (ForkServiceDependencies), not concretions
 */
export class ConversationForkService {
	constructor(private deps: ForkServiceDependencies) {}

	async fork(
		history: ChatHistory,
		messageId: string,
		selectedModels: string[],
		currentTitle: string
	): Promise<boolean> {
		const message = history.messages[messageId];

		if (!message) {
			this.deps.showError(this.deps.translate('Message not found'));
			return false;
		}

		try {
			// Pure domain logic
			const forkedHistory = createForkedHistory(history, messageId);
			const title = generateForkTitle(
				forkedHistory,
				currentTitle || this.deps.translate('New Chat'),
				this.deps.translate('Fork')
			);

			// Side effects (isolated)
			const newChat = await this.deps.createChat(
				this.deps.getToken(),
				{
					title,
					models: selectedModels,
					history: forkedHistory,
					timestamp: Date.now()
				},
				null
			);

			if (newChat) {
				this.deps.showSuccess(this.deps.translate('Conversation forked successfully'));
				await this.deps.refreshChatList();
				await this.deps.navigate(`/c/${newChat.id}`);
				return true;
			}

			return false;
		} catch (error) {
			console.error('Error forking conversation:', error);
			this.deps.showError(this.deps.translate('Failed to fork conversation'));
			return false;
		}
	}
}
