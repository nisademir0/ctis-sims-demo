<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ChatbotFallbackResponse;

class ChatbotFallbackResponsesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $fallbackResponses = [
            [
                'trigger_keyword' => 'yardım',
                'response_text' => 'Size nasıl yardımcı olabilirim? Envanter hakkında sorular sorabilir, örneğin: "Kaç tane monitör var?", "Ahmet\'in eşyaları nelerdir?", "Boşta olan koltuklar hangileri?"',
                'is_active' => true,
            ],
            [
                'trigger_keyword' => 'help',
                'response_text' => 'How can I help you? You can ask questions about inventory, such as: "How many monitors are there?", "What items does Ahmet have?", "Which chairs are available?"',
                'is_active' => true,
            ],
            [
                'trigger_keyword' => 'merhaba',
                'response_text' => 'Merhaba! CTIS Envanter Yönetim Sistemi chatbot\'una hoş geldiniz. Size envanter hakkında bilgi verebilirim. Ne öğrenmek istersiniz?',
                'is_active' => true,
            ],
            [
                'trigger_keyword' => 'hello',
                'response_text' => 'Hello! Welcome to the CTIS Inventory Management System chatbot. I can provide you with information about the inventory. What would you like to know?',
                'is_active' => true,
            ],
            [
                'trigger_keyword' => 'teşekkür',
                'response_text' => 'Rica ederim! Başka bir sorunuz varsa sormaktan çekinmeyin.',
                'is_active' => true,
            ],
            [
                'trigger_keyword' => 'thank',
                'response_text' => 'You\'re welcome! Feel free to ask if you have any other questions.',
                'is_active' => true,
            ],
            [
                'trigger_keyword' => 'neler yapabilirsin',
                'response_text' => 'Envanter hakkında çeşitli sorulara cevap verebilirim:\n- "Kaç tane X var?" (sayım)\n- "Hangi eşyalar boşta?" (durum sorgulama)\n- "X nerede?" (konum bilgisi)\n- "Y\'nin eşyaları neler?" (kullanıcı bazlı)\n- "Bu hafta eklenen eşyalar" (zaman bazlı)',
                'is_active' => true,
            ],
            [
                'trigger_keyword' => 'what can you do',
                'response_text' => 'I can answer various questions about inventory:\n- "How many X are there?" (counting)\n- "Which items are available?" (status queries)\n- "Where is X?" (location info)\n- "What items does Y have?" (user-based)\n- "Items added this week" (time-based)',
                'is_active' => true,
            ],
            [
                'trigger_keyword' => 'çalışmıyor',
                'response_text' => 'Üzgünüm, bir sorun yaşıyorsunuz. Lütfen sorunuzu farklı bir şekilde ifade etmeyi deneyin veya sistem yöneticisiyle iletişime geçin.',
                'is_active' => true,
            ],
            [
                'trigger_keyword' => 'not working',
                'response_text' => 'I\'m sorry you\'re experiencing an issue. Please try rephrasing your question differently or contact the system administrator.',
                'is_active' => true,
            ],
            [
                'trigger_keyword' => 'hata',
                'response_text' => 'Bir hata oluştu. Lütfen sorunuzu daha basit bir şekilde sormayı deneyin. Örneğin: "Boştaki monitörler" veya "Ahmet\'in eşyaları"',
                'is_active' => true,
            ],
            [
                'trigger_keyword' => 'error',
                'response_text' => 'An error occurred. Please try asking your question in a simpler way. For example: "Available monitors" or "Ahmet\'s items"',
                'is_active' => true,
            ],
        ];

        foreach ($fallbackResponses as $response) {
            ChatbotFallbackResponse::updateOrCreate(
                ['trigger_keyword' => $response['trigger_keyword']],
                $response
            );
        }

        $this->command->info('✅ Chatbot fallback responses seeded successfully.');
    }
}
