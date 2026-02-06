import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';

interface Message {
    id: string;
    role: 'user' | 'bot';
    content: string;
    actions?: ('create' | 'gallery' | 'mypage')[];
}

const CHAT_TRANSLATIONS = {
    ko: {
        welcome: "안녕하세요! 궁금한 점이 있으신가요?",
        suggestions: {
            howTo: "브릭 어떻게 만들어요?",
            gallery: "갤러리는 뭐예요?",
            inquiry: "문의하기",
            report: "신고하기",
        },
        toggleSuggestions: "이런 질문을 해보세요",
        toggleSuggestionsAfter: "다른 질문은 있으신가요?",
        placeholder: "궁금한 내용을 입력하세요...",
        send: "전송",
        header: "BrickBot",
        inquiry: {
            modeTitle: "1:1 문의하기",
            titlePlace: "문의 제목",
            contentPlace: "문의 내용을 자세히 적어주세요.",
            btn: "문의 접수",
            confirm: "문의가 접수되었습니다! 관리자가 확인 후 빠르게 답변드리겠습니다."
        },
        report: {
            modeTitle: "신고하기",
            reasonLabel: "신고 사유",
            contentPlace: "신고 내용을 적어주세요.",
            btn: "신고 접수",
            confirm: "신고가 접수되었습니다. 관리자가 검토 후 조치하겠습니다.",
            reasons: {
                SPAM: "스팸 / 부적절한 홍보",
                INAPPROPRIATE: "부적절한 콘텐츠",
                ABUSE: "욕설 / 비하 발언",
                COPYRIGHT: "저작권 침해",
                OTHER: "기타"
            }
        },
        cancel: "취소",
        alertTitle: "알림",
        errorTitle: "오류",
        actions: {
            create: "브릭 만들기 시작",
            gallery: "갤러리 구경하기",
            mypage: "내 정보 보기"
        },
        error: "죄송해요, 잠시 문제가 생겼어요. 다시 시도해주세요!",
        loginRequired: "로그인이 필요한 서비스입니다.",
        inputRequired: "입력 내용을 확인해주세요.",
        submitFailed: "접수에 실패했습니다.",
    },
    en: {
        welcome: "Hello! How can I help you today?",
        suggestions: {
            howTo: "How do I make Brick?",
            gallery: "What is Gallery?",
            inquiry: "Inquiry",
            report: "Report",
        },
        toggleSuggestions: "Suggested Questions",
        toggleSuggestionsAfter: "Do you have any other questions?",
        placeholder: "Ask me anything...",
        send: "Send",
        header: "BrickBot",
        inquiry: {
            modeTitle: "1:1 Inquiry",
            titlePlace: "Title",
            contentPlace: "Please describe your inquiry.",
            btn: "Submit Inquiry",
            confirm: "Inquiry submitted! We will get back to you soon."
        },
        report: {
            modeTitle: "Report Details",
            reasonLabel: "Reason",
            contentPlace: "Please describe the issue.",
            btn: "Submit Report",
            confirm: "Report submitted. We will review it shortly.",
            reasons: {
                SPAM: "Spam / Promotion",
                INAPPROPRIATE: "Inappropriate Content",
                ABUSE: "Abusive Language",
                COPYRIGHT: "Copyright Infringement",
                OTHER: "Other"
            }
        },
        cancel: "Cancel",
        alertTitle: "Notice",
        errorTitle: "Error",
        actions: {
            create: "Start Creating",
            gallery: "Visit Gallery",
            mypage: "My Page"
        },
        error: "Sorry, something went wrong. Please try again!",
        loginRequired: "Login required.",
        inputRequired: "Please check your input.",
        submitFailed: "Submission failed.",
    },
    ja: {
        welcome: "こんにちは！何かお手伝いしましょうか？",
        suggestions: {
            howTo: "どうやってブリックを作るの？",
            gallery: "ギャラリーって何？",
            inquiry: "お問い合わせ",
            report: "通報する",
        },
        toggleSuggestions: "こんな質問はどうですか？",
        toggleSuggestionsAfter: "他に質問はありますか？",
        placeholder: "気になることを入力してください...",
        send: "送信",
        header: "BrickBot",
        inquiry: {
            modeTitle: "1:1 お問い合わせ",
            titlePlace: "タイトル",
            contentPlace: "お問い合わせ内容を詳しく書いてください。",
            btn: "送信する",
            confirm: "お問い合わせを受け付けました！確認後、すぐにお答えします。"
        },
        report: {
            modeTitle: "通報する",
            reasonLabel: "通報理由",
            contentPlace: "内容を書いてください。",
            btn: "通報する",
            confirm: "通報を受け付けました。管理者が確認して対応します。",
            reasons: {
                SPAM: "スパム / 不適切な宣伝",
                INAPPROPRIATE: "不適切なコンテンツ",
                ABUSE: "暴言 / 誹謗中傷",
                COPYRIGHT: "著作権侵害",
                OTHER: "その他"
            }
        },
        cancel: "キャンセル",
        alertTitle: "お知らせ",
        errorTitle: "エラー",
        actions: {
            create: "ブリックを作り始める",
            gallery: "ギャラリーを見る",
            mypage: "マイページ"
        },
        error: "申し訳ありません。問題が発生しました。もう一度お試しください！",
        loginRequired: "ログインが必要です。",
        inputRequired: "入力内容を確認してください。",
        submitFailed: "送信に失敗しました.",
    }
};

export default function BrickBotScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { language } = useLanguage();
    const tChat = CHAT_TRANSLATIONS[(language as 'ko' | 'en' | 'ja') || 'ko'];
    const { isLoggedIn } = useAuth();
    const flatListRef = useRef<FlatList>(null);

    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'bot', content: tChat.welcome },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Form States
    const [mode, setMode] = useState<'CHAT' | 'INQUIRY' | 'REPORT'>('CHAT');
    const [formTitle, setFormTitle] = useState('');
    const [formContent, setFormContent] = useState('');
    const [reportReason, setReportReason] = useState('SPAM');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const suggestedQuestions = [
        tChat.suggestions.howTo,
        tChat.suggestions.gallery,
        tChat.suggestions.inquiry,
        tChat.suggestions.report,
    ];

    const parseBotResponse = (text: string): { cleanText: string, actions: ('create' | 'gallery' | 'mypage')[] } => {
        const actions: ('create' | 'gallery' | 'mypage')[] = [];
        let cleanText = text;

        if (cleanText.includes('{{NAV_CREATE}}')) actions.push('create');
        if (cleanText.includes('{{NAV_GALLERY}}')) actions.push('gallery');
        if (cleanText.includes('{{NAV_MYPAGE}}')) actions.push('mypage');

        cleanText = cleanText.replace(/\{\{NAV_CREATE\}\}/g, '')
            .replace(/\{\{NAV_GALLERY\}\}/g, '')
            .replace(/\{\{NAV_MYPAGE\}\}/g, '')
            .trim();

        return { cleanText, actions };
    };

    const handleActionClick = (action: string) => {
        switch (action) {
            case 'create':
                router.replace('/create-selection');
                break;
            case 'gallery':
                router.replace('/(tabs)/explore');
                break;
            case 'mypage':
                router.replace('/my-page');
                break;
        }
    };

    const handleSuggestionClick = (q: string) => {
        if (q === tChat.suggestions.inquiry) {
            if (!isLoggedIn) return Alert.alert(tChat.alertTitle, tChat.loginRequired);
            setMode('INQUIRY');
            setFormTitle('');
            setFormContent('');
        } else if (q === tChat.suggestions.report) {
            if (!isLoggedIn) return Alert.alert(tChat.alertTitle, tChat.loginRequired);
            setMode('REPORT');
            setFormContent('');
            setReportReason('SPAM');
        } else {
            handleSend(q);
        }
        setShowSuggestions(false);
    };

    const handleSend = async (text: string = input) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await api.queryChat({ message: text, language: language || 'ko' });
            const { cleanText, actions } = parseBotResponse(res.data.reply);

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'bot',
                content: cleanText,
                actions: actions.length > 0 ? actions : undefined
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', content: tChat.error }]);
        } finally {
            setIsLoading(false);
        }
    };

    const submitInquiry = async () => {
        if (!formTitle.trim() || !formContent.trim()) return Alert.alert(tChat.alertTitle, tChat.inputRequired);
        setIsSubmitting(true);
        try {
            await api.submitInquiry({ title: formTitle, content: formContent });
            setMode('CHAT');
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', content: tChat.inquiry.confirm }]);
        } catch (error) {
            Alert.alert(tChat.errorTitle, tChat.error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitReport = async () => {
        if (!formContent.trim()) return Alert.alert(tChat.alertTitle, tChat.inputRequired);
        setIsSubmitting(true);
        try {
            await api.submitReport({
                targetType: 'GENERAL',
                targetId: '0',
                reason: reportReason,
                details: formContent
            });
            setMode('CHAT');
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', content: tChat.report.confirm }]);
        } catch (error) {
            Alert.alert(tChat.errorTitle, tChat.error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <View style={[styles.messageRow, item.role === 'user' ? styles.userRow : styles.botRow]}>
            {item.role === 'bot' && (
                <Image source={require('@/assets/icons/chatbot.png')} style={styles.avatar} />
            )}
            <View style={styles.bubbleContainer}>
                <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.botBubble]}>
                    <Text style={[styles.messageText, item.role === 'user' ? styles.userText : styles.botText]}>
                        {item.content}
                    </Text>
                </View>
                {item.actions && (
                    <View style={styles.actionRow}>
                        {item.actions.map((act, idx) => (
                            <TouchableOpacity key={idx} style={styles.actionBtn} onPress={() => handleActionClick(act)}>
                                <Text style={styles.actionBtnText}>{tChat.actions[act]}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 60}
            >
                {mode === 'CHAT' ? (
                    <>
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessage}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        />

                        {isLoading && (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator size="small" color="#aaa" />
                            </View>
                        )}

                        {/* Suggestions */}
                        <View style={styles.suggestionArea}>
                            <TouchableOpacity
                                style={styles.suggestionToggle}
                                onPress={() => setShowSuggestions(!showSuggestions)}
                            >
                                <Text style={styles.suggestionToggleText}>
                                    {messages.length > 1 ? tChat.toggleSuggestionsAfter : tChat.toggleSuggestions}
                                </Text>
                                <Ionicons name={showSuggestions ? "chevron-down" : "chevron-up"} size={16} color="#666" />
                            </TouchableOpacity>
                            {showSuggestions && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionScroll}>
                                    {suggestedQuestions.map((q, idx) => (
                                        <TouchableOpacity key={idx} style={styles.suggestionBtn} onPress={() => handleSuggestionClick(q)}>
                                            <Text style={styles.suggestionText}>{q}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>

                        {/* Input */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder={tChat.placeholder}
                                placeholderTextColor="#888"
                                value={input}
                                onChangeText={setInput}
                                multiline
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                                onPress={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                            >
                                <Ionicons name="send" size={20} color={input.trim() ? "#000" : "#ccc"} />
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    /* FORM MODE */
                    <ScrollView contentContainerStyle={styles.formContainer}>
                        <View style={styles.formHeader}>
                            <Text style={styles.formTitle}>{mode === 'INQUIRY' ? tChat.inquiry.modeTitle : tChat.report.modeTitle}</Text>
                            <TouchableOpacity onPress={() => setMode('CHAT')}>
                                <Text style={styles.cancelText}>{tChat.cancel}</Text>
                            </TouchableOpacity>
                        </View>

                        {mode === 'INQUIRY' ? (
                            <>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder={tChat.inquiry.titlePlace}
                                    value={formTitle}
                                    onChangeText={setFormTitle}
                                />
                                <TextInput
                                    style={[styles.formInput, styles.formTextarea]}
                                    placeholder={tChat.inquiry.contentPlace}
                                    value={formContent}
                                    onChangeText={setFormContent}
                                    multiline
                                />
                                <TouchableOpacity style={styles.submitBtn} onPress={submitInquiry} disabled={isSubmitting}>
                                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{tChat.inquiry.btn}</Text>}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.label}>{tChat.report.reasonLabel}</Text>
                                <View style={styles.reasonContainer}>
                                    {Object.entries(tChat.report.reasons).map(([key, label]) => (
                                        <TouchableOpacity
                                            key={key}
                                            style={[styles.reasonBtn, reportReason === key && styles.reasonBtnActive]}
                                            onPress={() => setReportReason(key)}
                                        >
                                            <Text style={[styles.reasonBtnText, reportReason === key && styles.reasonBtnTextActive]}>{label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <TextInput
                                    style={[styles.formInput, styles.formTextarea]}
                                    placeholder={tChat.report.contentPlace}
                                    value={formContent}
                                    onChangeText={setFormContent}
                                    multiline
                                />
                                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#FF3B30' }]} onPress={submitReport} disabled={isSubmitting}>
                                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{tChat.report.btn}</Text>}
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
                )}
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 16,
        maxWidth: '85%',
    },
    userRow: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    botRow: {
        alignSelf: 'flex-start',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 8,
    },
    bubbleContainer: {
        flex: 1,
    },
    bubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    userBubble: {
        backgroundColor: '#000',
        borderTopRightRadius: 2,
    },
    botBubble: {
        backgroundColor: '#f0f0f0',
        borderTopLeftRadius: 2,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
        fontFamily: 'NotoSansKR_400Regular',
    },
    userText: {
        color: '#fff',
    },
    botText: {
        color: '#111',
    },
    actionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 8,
    },
    actionBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    actionBtnText: {
        fontSize: 13,
        color: '#555',
        fontWeight: '600',
    },
    loadingRow: {
        paddingHorizontal: 60,
        marginBottom: 16,
    },
    suggestionArea: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    suggestionToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    suggestionToggleText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600',
    },
    suggestionScroll: {
        flexDirection: 'row',
    },
    suggestionBtn: {
        backgroundColor: '#f8f8f8',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    suggestionText: {
        fontSize: 13,
        color: '#333',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
        fontFamily: 'NotoSansKR_400Regular',
    },
    sendBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    sendBtnDisabled: {
        opacity: 0.5,
    },
    formContainer: {
        padding: 20,
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '800',
        fontFamily: 'NotoSansKR_700Bold',
    },
    cancelText: {
        color: '#666',
        fontSize: 15,
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginBottom: 16,
        fontFamily: 'NotoSansKR_400Regular',
    },
    formTextarea: {
        height: 200,
        textAlignVertical: 'top',
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '600',
    },
    reasonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    reasonBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    reasonBtnActive: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    reasonBtnText: {
        fontSize: 13,
        color: '#666',
    },
    reasonBtnTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    submitBtn: {
        backgroundColor: '#000',
        borderRadius: 12,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'NotoSansKR_700Bold',
    },
});
