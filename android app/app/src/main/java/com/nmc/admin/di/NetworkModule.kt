package com.nmc.admin.di

import com.nmc.admin.BuildConfig
import com.nmc.admin.data.local.EncryptedPrefs
import com.nmc.admin.data.remote.NmcApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideAuthInterceptor(encryptedPrefs: EncryptedPrefs): Interceptor {
        return Interceptor { chain ->
            val original = chain.request()
            val requestBuilder = original.newBuilder()
            
            val requestPath = original.url.encodedPath
            val token = encryptedPrefs.getToken()
            if (!token.isNullOrEmpty() && !requestPath.endsWith("admin/login")) {
                requestBuilder.header("Authorization", "Bearer $token")
            }
            
            chain.proceed(requestBuilder.build())
        }
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(authInterceptor: Interceptor): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(logging)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        val baseUrl = BuildConfig.NMC_API_BASE_URL
        val formattedBaseUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
        
        return Retrofit.Builder()
            .baseUrl(formattedBaseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideNmcApiService(retrofit: Retrofit): NmcApiService {
        return retrofit.create(NmcApiService::class.java)
    }
}
