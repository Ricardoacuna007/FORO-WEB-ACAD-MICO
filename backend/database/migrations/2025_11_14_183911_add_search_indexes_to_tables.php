<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Índices para publicaciones (búsqueda en título y contenido)
        if (Schema::hasTable('publicaciones')) {
            Schema::table('publicaciones', function (Blueprint $table) {
                // Índice compuesto para búsqueda activa
                if (!$this->hasIndex('publicaciones', 'publicaciones_activo_titulo_index')) {
                    $table->index(['activo', 'titulo'], 'publicaciones_activo_titulo_index');
                }
                // Índice para contenido (solo si no existe)
                if (!$this->hasIndex('publicaciones', 'publicaciones_contenido_index')) {
                    DB::statement('CREATE INDEX publicaciones_contenido_index ON publicaciones(contenido(255))');
                }
            });
        }

        // Índices para comentarios
        if (Schema::hasTable('comentarios')) {
            Schema::table('comentarios', function (Blueprint $table) {
                if (!$this->hasIndex('comentarios', 'comentarios_activo_index')) {
                    $table->index('activo', 'comentarios_activo_index');
                }
                if (!$this->hasIndex('comentarios', 'comentarios_contenido_index')) {
                    DB::statement('CREATE INDEX comentarios_contenido_index ON comentarios(contenido(255))');
                }
            });
        }

        // Índices para usuarios
        if (Schema::hasTable('usuarios')) {
            Schema::table('usuarios', function (Blueprint $table) {
                if (!$this->hasIndex('usuarios', 'usuarios_activo_nombre_index')) {
                    $table->index(['activo', 'nombre'], 'usuarios_activo_nombre_index');
                }
                if (!$this->hasIndex('usuarios', 'usuarios_email_index')) {
                    $table->index('email', 'usuarios_email_index');
                }
            });
        }

        // Índices para materias
        if (Schema::hasTable('materias')) {
            Schema::table('materias', function (Blueprint $table) {
                if (!$this->hasIndex('materias', 'materias_activo_nombre_index')) {
                    $table->index(['activo', 'nombre'], 'materias_activo_nombre_index');
                }
                if (!$this->hasIndex('materias', 'materias_codigo_index')) {
                    $table->index('codigo', 'materias_codigo_index');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('publicaciones')) {
            Schema::table('publicaciones', function (Blueprint $table) {
                $table->dropIndex('publicaciones_activo_titulo_index');
                DB::statement('DROP INDEX IF EXISTS publicaciones_contenido_index ON publicaciones');
            });
        }

        if (Schema::hasTable('comentarios')) {
            Schema::table('comentarios', function (Blueprint $table) {
                $table->dropIndex('comentarios_activo_index');
                DB::statement('DROP INDEX IF EXISTS comentarios_contenido_index ON comentarios');
            });
        }

        if (Schema::hasTable('usuarios')) {
            Schema::table('usuarios', function (Blueprint $table) {
                $table->dropIndex('usuarios_activo_nombre_index');
                $table->dropIndex('usuarios_email_index');
            });
        }

        if (Schema::hasTable('materias')) {
            Schema::table('materias', function (Blueprint $table) {
                $table->dropIndex('materias_activo_nombre_index');
                $table->dropIndex('materias_codigo_index');
            });
        }
    }

    /**
     * Verifica si un índice existe
     */
    private function hasIndex(string $table, string $indexName): bool
    {
        try {
            $result = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
            return count($result) > 0;
        } catch (\Exception $e) {
            return false;
        }
    }
};
