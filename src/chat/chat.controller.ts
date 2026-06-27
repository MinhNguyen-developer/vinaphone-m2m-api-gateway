import { Controller, Post, Body, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('stream')
  @ApiOperation({
    summary: 'Stream an AI answer via Server-Sent Events',
    description:
      'Proxies the request to the AI agent and streams back SSE events. ' +
      'Event types: `token`, `tool_start`, `tool_end`, `done`, `error`.',
  })
  async stream(
    @Body() dto: CreateChatDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.chatService.streamChat(dto, res);
  }

  @Post('index')
  @ApiOperation({
    summary: 'Sync all database records into Qdrant for AI search',
    description:
      'Fetches all SIMs, alerts, groups, master SIMs, and usage history from the ' +
      'database, sends them to the AI agent, which embeds and stores them in Qdrant. ' +
      'This is a full re-index — existing data in Qdrant is wiped first.',
  })
  async index(): Promise<{ message: string; stats: Record<string, number> }> {
    return this.chatService.indexData();
  }
}
