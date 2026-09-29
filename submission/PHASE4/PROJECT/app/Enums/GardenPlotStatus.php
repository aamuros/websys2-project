<?php

namespace App\Enums;

enum GardenPlotStatus: string
{
    case Available = 'available';
    case Reserved = 'reserved';
    case Occupied = 'occupied';
    case Maintenance = 'maintenance';
}
