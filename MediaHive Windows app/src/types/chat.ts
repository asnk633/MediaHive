export type ChatRoom = {
  id: string;
  name: string;
  createdAt: string; // ISO string
  createdBy: string; // User ID
  isMediaTeamOnly: boolean;
  lastMessageTime?: string;
  lastMessagePreview?: string;
};

export type ChatParticipantRole = 'Manager' | 'Team' | 'Member';

export type ChatParticipant = {
  userId: string;
  roomId: string;
  role: ChatParticipantRole;
  addedBy: string; // User ID of the person who added them
  addedAt: string; // ISO string
};

export type ChatMessageType = 'text' | 'image' | 'document' | 'voice';

export type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  text?: string;
  mediaUrl?: string;
  mediaType: ChatMessageType;
  createdAt: string; // ISO string
};

export type ChatRoomWithParticipants = ChatRoom & {
  participants: ChatParticipant[];
};
