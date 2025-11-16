<?php

namespace App\Providers;

use App\Models\Notificacion;
use App\Observers\NotificacionObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Notificacion::observe(NotificacionObserver::class);
    }
}
