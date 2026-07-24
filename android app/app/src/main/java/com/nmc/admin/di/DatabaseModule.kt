package com.nmc.admin.di

import android.content.Context
import androidx.room.Room
import com.nmc.admin.data.local.AppDatabase
import com.nmc.admin.data.local.dao.OfflinePatchDao
import com.nmc.admin.data.local.dao.RegistrationDao
import com.nmc.admin.security.DatabaseKeyManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import net.sqlcipher.database.SupportFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(
        @ApplicationContext context: Context
    ): AppDatabase {
        val passphrase = DatabaseKeyManager.getDatabasePassphrase(context)
        val factory = SupportFactory(passphrase)
        
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "nmc_admin_secure.db"
        )
        .openHelperFactory(factory)
        .fallbackToDestructiveMigration()
        .build()
    }

    @Provides
    fun provideRegistrationDao(database: AppDatabase): RegistrationDao {
        return database.registrationDao()
    }

    @Provides
    fun provideOfflinePatchDao(database: AppDatabase): OfflinePatchDao {
        return database.offlinePatchDao()
    }

    @Provides
    fun provideVolunteerDao(database: AppDatabase): com.nmc.admin.data.local.dao.VolunteerDao {
        return database.volunteerDao()
    }
}
