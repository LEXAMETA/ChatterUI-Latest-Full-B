// app/screens/ModelManager/index.tsx

import ThemedButton from '@components/buttons/ThemedButton'
import HeaderButton from '@components/views/HeaderButton'
import HeaderTitle from '@components/views/HeaderTitle'
import { AntDesign } from '@expo/vector-icons'
import { Llama } from '@lib/engine/Local/LlamaLocal' // Keep this import
import { Model } from '@lib/engine/Local/Model' // Keep this import
import { Theme } from '@lib/theme/ThemeManager'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useState } from 'react'
import { StyleSheet, Text, View, FlatList } from 'react-native'
import * as Progress from 'react-native-progress'
import Animated, { Easing, SlideInLeft, SlideOutLeft } from 'react-native-reanimated'

import ModelEmpty from './ModelEmpty'
import ModelItem from './ModelItem'
import ModelNewMenu from './ModelNewMenu'
import ModelSettings from './ModelSettings'

const ModelManager = () => {
    const styles = useStyles()
    const { color } = Theme.useTheme()

    const { data: models, updatedAt } = useLiveQuery(Model.getModelListQuery()) // Renamed 'data' to 'models'

    const [showSettings, setShowSettings] = useState(false)

    const [modelLoading, setModelLoading] = useState(false)
    const [modelImporting, setModelImporting] = useState(false)

    // Select currentChatModel and load/unload functions directly from useLlama state
    const { currentChatModel, loadProgress, setloadProgress, loadCurrentChatModel, unloadCurrentChatModel } = Llama.useLlama((state) => ({
        currentChatModel: state.currentChatModel,
        loadProgress: state.loadProgress,
        setloadProgress: state.setLoadProgress,
        loadCurrentChatModel: state.loadCurrentChatModel, // Get the load function
        unloadCurrentChatModel: state.unloadCurrentChatModel, // Get the unload function
    }));

    // Get RAG model IDs and setters from useEngineData state
    const { embeddingModelId, ragReasoningModelId, setEmbeddingModelId, setRagReasoningModelId } = Llama.useEngineData((state) => ({
        embeddingModelId: state.embeddingModelId,
        ragReasoningModelId: state.ragReasoningModelId,
        setEmbeddingModelId: state.setEmbeddingModelId,
        setRagReasoningModelId: state.setRagReasoningModelId,
    }));


    return (
        <View style={styles.mainContainer}>
            <HeaderTitle title={showSettings ? 'Model Settings' : 'Models'} />
            <HeaderButton
                headerRight={() =>
                    !showSettings && (
                        <ModelNewMenu
                            modelImporting={modelImporting}
                            setModelImporting={setModelImporting}
                        />
                    )
                }
            />

            {!showSettings && (
                <Animated.View
                    style={{ flex: 1 }}
                    entering={SlideInLeft.easing(Easing.inOut(Easing.cubic))}
                    exiting={SlideOutLeft.easing(Easing.inOut(Easing.cubic))}>
                    <View style={styles.modelContainer}>
                        {!modelImporting && !modelLoading && models.length !== 0 && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                }}>
                                <Text style={styles.subtitle}>Model Loaded: </Text>
                                <Text style={styles.modelTitle} ellipsizeMode="tail">
                                    {currentChatModel ? currentChatModel.name : 'None'}
                                </Text>
                            </View>
                        )}
                        {!modelImporting && !modelLoading && models.length === 0 && updatedAt && (
                            <View>
                                <Text style={styles.hint}>
                                    Hint: Press <AntDesign name="addfile" size={16} /> and import a
                                    GGUF model!
                                </Text>
                            </View>
                        )}

                        {!modelLoading && modelImporting && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Progress.Bar
                                    style={{ flex: 5 }}
                                    indeterminate
                                    indeterminateAnimationDuration={2000}
                                    color={color.primary._500}
                                    borderColor={color.neutral._300}
                                    height={12}
                                    borderRadius={12}
                                    width={null}
                                />

                                <Text
                                    style={{
                                        flex: 2,
                                        color: color.text._100,
                                        textAlign: 'center',
                                    }}>
                                    Importing...
                                </Text>
                            </View>
                        )}

                        {modelLoading && !modelImporting && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Progress.Bar
                                    style={{ flex: 5 }}
                                    progress={loadProgress / 100}
                                    color={color.primary._500}
                                    borderColor={color.neutral._300}
                                    height={12}
                                    borderRadius={12}
                                    width={null}
                                />
                                <Text
                                    style={{
                                        flex: 1,
                                        color: color.text._100,
                                        textAlign: 'center',
                                    }}>
                                    {loadProgress}%
                                </Text>
                            </View>
                        )}
                    </View>

                    {models.length === 0 && updatedAt && <ModelEmpty />}

                    <FlatList
                        style={styles.list}
                        data={models}
                        renderItem={({ item, index }) => (
                            <ModelItem
                                item={item}
                                index={index}
                                modelLoading={modelLoading}
                                setModelLoading={(b: boolean) => {
                                    if (b) setloadProgress(0)
                                    setModelLoading(b)
                                }}
                                modelImporting={modelImporting}
                                // Pass current chat model and its loader/unloader to ModelItem
                                currentChatModel={currentChatModel}
                                loadCurrentChatModel={loadCurrentChatModel}
                            />
                        )}
                        keyExtractor={(item) => item.id.toString()}
                        removeClippedSubviews={false}
                        showsVerticalScrollIndicator={false}
                    />
                </Animated.View>
            )}

            {showSettings && (
                <ModelSettings
                    modelImporting={modelImporting}
                    modelLoading={modelLoading}
                    exit={() => setShowSettings(false)}
                    models={models} // Pass all models to settings
                    // Pass RAG model state and setters to ModelSettings
                    embeddingModelId={embeddingModelId}
                    ragReasoningModelId={ragReasoningModelId}
                    setEmbeddingModelId={setEmbeddingModelId}
                    setRagReasoningModelId={setRagReasoningModelId}
                />
            )}
            <ThemedButton
                label={showSettings ? 'Back To Models' : 'Show Settings'}
                onPress={() => setShowSettings(!showSettings)}
            />
        </View>
    )
}

export default ModelManager

export const useStyles = () => {
    const { color, spacing, borderRadius, fontSize } = Theme.useTheme()

    return StyleSheet.create({
        mainContainer: {
            paddingTop: spacing.xl,
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.xl2,
            flex: 1,
        },

        list: {
            flex: 1,
        },

        modelContainer: {
            borderRadius: borderRadius.l,
            paddingVertical: spacing.l,
            paddingHorizontal: spacing.xl2,
            backgroundColor: color.neutral._200,
            marginBottom: spacing.l,
        },

        title: {
            fontSize: fontSize.l,
            color: color.text._100,
        },

        modelTitle: {
            color: color.primary._700,
        },

        subtitle: {
            color: color.text._300,
        },

        hint: {
            color: color.text._400,
        },
    })
}
