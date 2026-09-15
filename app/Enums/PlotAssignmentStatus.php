<?php

namespace App\Enums;

enum PlotAssignmentStatus: string
{
    case Active = 'active';
    case Ended = 'ended';
    case Cancelled = 'cancelled';
}
