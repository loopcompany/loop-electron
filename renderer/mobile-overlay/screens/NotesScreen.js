import useRealtimeRefresh from '../hooks/useRealtimeRefresh';
import React, { useState, useEffect,useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';
import ScreenHeaders from "@components/ScreenHeaders";
import NewStyles from "@styles/NewStyles";
import { themeColor1, themeColor4, themeColor0, themeColor3 } from "@theme/Color";
import { notesAPI } from "@services/Api";
import { showToastOrAlert, showAlert, formatDate, formatDateTime, langIsRTL } from "@helpers/Common";
import Button from "@components/Button";
import moment from "moment-jalaali";
import { createStyles } from '@styles/NewStyles';
import { SafeAreaView } from "react-native-safe-area-context";
import FooterSpacer from '@components/FooterSpacer';
export default function NotesScreen({ route, navigation }) {
  useRealtimeRefresh(["account"], () => fetchNotes());
const { t, i18n } = useTranslation();
const isRTL = langIsRTL(i18n.language);
  const NewStyles = useMemo(
    () => createStyles(i18n.language),
    [i18n.language]
  );
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  // Refresh when navigating back from Add/Edit Note
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchNotes();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await notesAPI.getAll();

      if (response.success && response.data) {
        setNotes(response.data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      if (notes.length > 0) {
        showToastOrAlert(t('Error fetching notes'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotes();
  };

  const handleDelete = (id) => {
    showAlert(
      t('Delete Note'),
      t('Are you sure you want to delete this note?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await notesAPI.delete(id);
              if (response.success) {
                showToastOrAlert(t('Note deleted successfully'));
                fetchNotes();
              }
            } catch (error) {
              console.error('Error deleting note:', error);
              showToastOrAlert(t('Error deleting note'));
            }
          },
        },
      ]
    );
  };

  const handleEdit = (note) => {
    navigation.navigate('AddEditNoteScreen', { note });
  };

  const handleAddNew = () => {
    navigation.navigate('AddEditNoteScreen');
  };

 
  const styles = useMemo(()=> createLocalStyles(NewStyles, isRTL), [NewStyles, isRTL]);
  const renderNoteCard = ({ item }) => {
    return (
      <View style={[styles.noteCard, NewStyles.border10]}>
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Ionicons name="time-outline" size={14} color={themeColor3.bgColor(1)} />
            <Text style={[NewStyles.text10, { fontSize: 12, marginRight: 5 }]}>
              {formatDateTime(item.created_at)}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => handleEdit(item)}
              style={styles.iconBtn}
            >
              <Ionicons name="create-outline" size={20} color={themeColor1.bgColor(1)} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              style={styles.iconBtn}
            >
              <Ionicons name="trash-outline" size={20} color="#d32f2f" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={[NewStyles.text10, { lineHeight: 24 }]}>
            {item.note}
          </Text>
        </View>

        {item.updated_at !== item.created_at && (
          <View style={styles.editedBadge}>
            <Text style={styles.editedText}>
              {t('Edited: ')}{formatDate(item.updated_at)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={80} color={themeColor3.bgColor(1)} />
      <Text style={[NewStyles.title10, { marginTop: 20 }]}>
        {t("You don't have any notes.")}
      </Text>
      <Text style={[NewStyles.text10, { marginTop: 10, textAlign: 'center' }]}>
        {t('Click the button below to add a new note')}
      </Text>
    </View>
  );

  if (loading && notes.length === 0) {
    return (
      <View style={[NewStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={themeColor1.bgColor(1)} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={{top:'off', bottom:'additive'}} style={NewStyles.container}>
      <ScreenHeaders title={t('My Notes')} />

      <FlatList
        ListFooterComponent={<FooterSpacer />}
        data={notes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNoteCard}
        contentContainerStyle={[
          styles.listContent,
          notes.length === 0 && { flex: 1 }
        ]}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <Button
          title={t('Add New Note')}
          onPress={handleAddNew}
        />
      </View>
    </SafeAreaView>
  );
}

const createLocalStyles = (NewStyles, isRTL) => StyleSheet.create({

  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  noteCard: {
    backgroundColor: themeColor4.bgColor(1),
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
  },
  cardHeader: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: themeColor3.bgColor(0.2),
  },
  dateContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    gap: 10,
  },
  iconBtn: {
    padding: 5,
  },
  cardContent: {
    minHeight: 50,
  },
  editedBadge: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: themeColor3.bgColor(0.2),
  },
  editedText: {
    fontSize: 11,
    color: themeColor3.bgColor(1),
    fontFamily: 'VazirLight',
    textAlign: 'left',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: themeColor3.bgColor(0.2),
    width: '100%',
    alignItems: 'center'
  },
});

