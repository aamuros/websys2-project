<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class HelpController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('help', ['faqs' => [
            ['question' => 'How do I request a plot?', 'answer' => 'Open Garden plots, choose an available plot, then submit your request. You can track it under My plot requests.'],
            ['question' => 'What happens after approval?', 'answer' => 'Approval creates your assignment immediately. Its dates and plot details appear under My assignments.'],
            ['question' => 'How do I cancel a request?', 'answer' => 'Open My plot requests and cancel while the request is still pending.'],
            ['question' => 'Where can I find garden activities?', 'answer' => 'Published work days and activities appear in Garden calendar. Announcements appear in Community updates.'],
            ['question' => 'How do I change my account details?', 'answer' => 'Use Settings or Account settings from the account menu to update your profile or password.'],
        ]]);
    }
}
