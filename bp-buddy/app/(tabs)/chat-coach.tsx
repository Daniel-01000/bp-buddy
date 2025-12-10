import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getLastNReadings, type BPReading } from '@/store/bpStore';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const TypingIndicator: React.FC = () => {
  const dot1Opacity = useRef(new Animated.Value(0.4)).current;
  const dot2Opacity = useRef(new Animated.Value(0.4)).current;
  const dot3Opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animate = () => {
      const sequence = Animated.sequence([
        Animated.timing(dot1Opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dot2Opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dot3Opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dot1Opacity, { toValue: 0.4, duration: 500, useNativeDriver: true }),
        Animated.timing(dot2Opacity, { toValue: 0.4, duration: 500, useNativeDriver: true }),
        Animated.timing(dot3Opacity, { toValue: 0.4, duration: 500, useNativeDriver: true }),
      ]);

      Animated.loop(sequence).start();
    };

    animate();
  }, [dot1Opacity, dot2Opacity, dot3Opacity]);

  return (
    <View style={styles.typingIndicator}>
      <Animated.View style={[styles.typingDot, { opacity: dot1Opacity }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot2Opacity }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot3Opacity }]} />
    </View>
  );
};

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY;
const API_URL = 'https://api.openai.com/v1/chat/completions';

interface ChatAPIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const convertChatHistory = (messages: ChatMessage[]): ChatAPIMessage[] => {
  const systemMessage: ChatAPIMessage = {
    role: 'system',
    content: "You are BP Buddy, a friendly and knowledgeable blood pressure health assistant. Have natural conversations about health and wellness. Answer questions directly and personally. Provide practical advice about blood pressure, lifestyle, diet, and exercise. Keep responses conversational (2-4 sentences), supportive, and use appropriate emojis. Always remind users you provide general information only - they should consult healthcare providers for medical advice. If readings are very high (≥180/120), suggest retaking after 5-10 minutes and seeking medical advice if they feel unwell. Be engaging and respond to what the user is specifically asking about."
  };

  const conversationMessages: ChatAPIMessage[] = messages
    .filter(msg => msg.id !== '1')
    .map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text
    }));

  return [systemMessage, ...conversationMessages];
};

const getCoachResponse = async (messages: ChatMessage[], readings: BPReading[]): Promise<string> => {
  console.log('🔑 API Key Debug:', {
    keyExists: !!API_KEY,
    keyLength: API_KEY?.length || 0,
    keyStart: API_KEY?.substring(0, 10) || 'undefined',
    envVar: process.env.EXPO_PUBLIC_OPENAI_KEY?.substring(0, 10) || 'undefined'
  });
  
  if (!API_KEY) {
    throw new Error('It looks like the API key isn\'t configured properly. Please check the app settings! 🔑');
  }

  try {
    const readingsContext = readings.length > 0 
      ? `Recent BP readings: ${readings.map(r => 
          `${r.systolic}/${r.diastolic} on ${r.timestamp.toLocaleDateString('en-IE')}${r.note ? ` (${r.note})` : ''}`
        ).join(', ')}`
      : 'No recent readings available';

    const apiMessages = convertChatHistory(messages);
    
    if (apiMessages.length > 1) {
      const lastMessage = apiMessages[apiMessages.length - 1];
      if (lastMessage.role === 'user') {
        lastMessage.content = `${lastMessage.content}\n\nContext: ${readingsContext}`;
      }
    }

    console.log('Sending to Health Coach:', {
      messageCount: apiMessages.length,
      lastUserMessage: apiMessages[apiMessages.length - 1]?.content?.substring(0, 100) + '...',
      hasReadings: readings.length > 0
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Health Coach API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const coachResponse = data.choices?.[0]?.message?.content;

    if (!coachResponse) {
      throw new Error('No response received from Health Coach');
    }

    return coachResponse.trim();
  } catch (error) {
    console.error('Health Coach API error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('API key not configured or invalid. Please check your .env file.');
      } else if (error.message.includes('401')) {
        throw new Error('Invalid API key. Please check your .env file.');
      } else if (error.message.includes('429')) {
        throw new Error('API rate limit exceeded. Please try again in a moment.');
      }
    }
    
    throw new Error('Unable to connect to health service. Please try again.');
  }
};

export default function ChatCoachScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hello! I'm your BP Buddy health coach! 🤖💙\n\nI can help you understand your blood pressure readings and provide wellness tips.\n\nWhat would you like to know about blood pressure management? 😊",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  
  useEffect(() => {
    console.log('🔧 Chat Coach Screen Loaded - Environment Check:', {
      API_KEY: API_KEY ? 'LOADED ✅' : 'MISSING ❌',
      keyLength: API_KEY?.length || 0,
      processEnv: process.env.EXPO_PUBLIC_OPENAI_KEY ? 'LOADED ✅' : 'MISSING ❌'
    });
  }, []);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const lastReadings = getLastNReadings(5);
      const coachResponse = await getCoachResponse(updatedMessages, lastReadings);

      const coachMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: coachResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, coachMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      let errorText = "Sorry, I'm having trouble connecting right now. Please try again in a moment! 😅";
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorText = "AI chat features are currently unavailable. You can still track your BP readings! �";
        } else if (error.message.includes('rate limit')) {
          errorText = "I'm getting too many requests right now. Please wait a moment and try again! ⏰";
        } else if (error.message.includes('Invalid')) {
          errorText = "There seems to be an issue with the API configuration. Please contact support! �️";
        }
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IE', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol size={24} name="chevron.left" color="#60A5FA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat with BP Coach</Text>
        <TouchableOpacity onPress={() => console.log('Phone icon pressed')}>
          <IconSymbol size={24} name="phone.fill" color="#60A5FA" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isUser ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.isUser ? styles.userText : styles.aiText,
                ]}>
                  {message.text}
                </Text>
                <Text style={[
                  styles.messageTime,
                  message.isUser ? styles.userTime : styles.aiTime,
                ]}>
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            </View>
          ))}

          {isLoading && (
            <View style={[styles.messageContainer, styles.aiMessage]}>
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <View style={styles.loadingContainer}>
                  <TypingIndicator />
                  <Text style={styles.loadingText}>BP Buddy is thinking...</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask anything..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            {inputText.trim() && (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendMessage}
                disabled={isLoading}
              >
                <IconSymbol size={16} name="arrow.up" color="#1E293B" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 20,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: '#60A5FA',
  },
  aiBubble: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#1E293B',
  },
  aiText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  userTime: {
    color: '#1E293B',
  },
  aiTime: {
    color: '#94A3B8',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  typingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#60A5FA',
  },
  loadingText: {
    color: '#94A3B8',
    fontStyle: 'italic',
    fontSize: 15,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 24,
    backgroundColor: '#0F172A',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    paddingVertical: 2,
    paddingHorizontal: 0,
    paddingRight: 8,
    lineHeight: 22,
    minHeight: 20,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#60A5FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
