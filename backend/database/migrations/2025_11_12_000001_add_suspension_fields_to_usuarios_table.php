<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            if (!Schema::hasColumn('usuarios', 'suspension_activa')) {
                $table->boolean('suspension_activa')->default(false)->after('activo');
            }

            if (!Schema::hasColumn('usuarios', 'suspendido_hasta')) {
                $table->timestamp('suspendido_hasta')->nullable()->after('suspension_activa');
            }

            if (!Schema::hasColumn('usuarios', 'suspension_motivo')) {
                $table->string('suspension_motivo', 500)->nullable()->after('suspendido_hasta');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            if (Schema::hasColumn('usuarios', 'suspension_motivo')) {
                $table->dropColumn('suspension_motivo');
            }

            if (Schema::hasColumn('usuarios', 'suspendido_hasta')) {
                $table->dropColumn('suspendido_hasta');
            }

            if (Schema::hasColumn('usuarios', 'suspension_activa')) {
                $table->dropColumn('suspension_activa');
            }
        });
    }
};

