/**
 * Svelte Hook / Composable for Fork Conversation
 *
 * This bridges the pure domain service with Svelte's reactive system.
 * Keeps the component thin and the business logic testable.
 */

import { goto } from '$app/navigation';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';
import { createNewChat, getChatList } from '$lib/apis/chats';
import { chats, currentChatPage, chatTitle, temporaryChatEnabled } from '$lib/stores';
import { createMessagesList } from '$lib/utils';
import {
	ConversationForkService,
	type ForkServiceDependencies,
	type ChatHistory
} from './conversationForkService';

/**
 * Creates a fork conversation handler with all dependencies injected.
 *
 * Usage in component:
 * ```svelte
 * <script>
 *   const forkConversation = createForkHandler(i18n);
 * </script>
 * ```
 */
export function createForkHandler(i18n: { t: (key: string) => string }) {
	// Dependency injection - all external dependencies are explicit
	const dependencies: ForkServiceDependencies = {
		createChat: async (token, chat, folderId) => {
			// Adapt to include messages list (existing API requirement)
			const chatWithMessages = {
				...chat,
				messages: createMessagesList(chat.history, chat.history.currentId)
			};
			return createNewChat(token, chatWithMessages, folderId);
		},

		refreshChatList: async () => {
			currentChatPage.set(1);
			const list = await getChatList(localStorage.token, get(currentChatPage));
			chats.set(list);
		},

		navigate: (url: string) => goto(url),

		showSuccess: (message: string) => toast.success(message),

		showError: (message: string) => toast.error(message),

		getToken: () => localStorage.token,

		translate: (key: string) => i18n.t(key)
	};

	const service = new ConversationForkService(dependencies);

	// Return the handler function
	return async (
		history: ChatHistory,
		messageId: string,
		selectedModels: string[]
	): Promise<boolean> => {
		// Guard: Check if temporary chat
		if (get(temporaryChatEnabled)) {
			toast.error(i18n.t('Cannot fork a temporary chat'));
			return false;
		}

		return service.fork(
			history,
			messageId,
			selectedModels,
			get(chatTitle) || ''
		);
	};
}
