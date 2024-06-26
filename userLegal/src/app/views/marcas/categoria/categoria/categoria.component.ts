import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { IonBackButton, IonButton, IonButtons, IonCard, IonCol, IonContent, IonFooter, IonGrid, IonHeader, IonIcon, IonItem, IonLabel, IonModal, IonRow, IonSelectOption, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { FirestoreService } from '../../../../common/services/firestore.service';
import { Categoria } from '../../../../common/models/categoria.model';
import { AlertController, LoadingController } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [IonCard, IonSpinner, IonButton, IonContent, IonTitle, IonHeader, IonIcon, IonModal, IonBackButton, IonToolbar, IonButtons, IonCol, IonGrid, IonRow, IonLabel, IonItem, IonFooter, IonSelectOption, CommonModule, FormsModule, ReactiveFormsModule],
  selector: 'app-categorias',
  templateUrl: './categoria.component.html',
  styleUrls: ['./categoria.component.scss'],
})
export class CategoriasPage implements OnInit {
  categorias: Categoria[] = [];
  newCategoriaForm: FormGroup;
  cargando = false;
  showForm = false;
  imagenCategoria: File | null = null;

  constructor(
    private firestoreService: FirestoreService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private changeDetectorRef: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.newCategoriaForm = this.fb.group({
      nombre: ['', Validators.required],
      imagen: ['']
    });
  }

  async ngOnInit() {
    this.categorias = await this.firestoreService.getCategorias();
    console.log('Categorías obtenidas en ngOnInit:', this.categorias);
  }

  loadCategorias() {
    this.firestoreService.getCollectionChanges<Categoria>('Categorias').subscribe(data => {
      if (data) {
        this.categorias = data;
      }
    });
  }

  async save() {
    if (this.newCategoriaForm.invalid) {
      return;
    }

    this.cargando = true;
    const categoriaData: Categoria = {
      id: this.firestoreService.createIdDoc(),
      nombre: this.newCategoriaForm.value.nombre,
      imagen: this.imagenCategoria ? this.imagenCategoria.name : ''
    };

    try {
      await this.firestoreService.addCategoria(categoriaData, this.imagenCategoria);
      this.newCategoriaForm.reset();
      this.showForm = false;
      this.cargando = false;
      this.loadCategorias();  // Update the list of categories
    } catch (error) {
      console.error('Error al agregar la categoría:', error);
      this.cargando = false;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagenCategoria = file;
      this.newCategoriaForm.patchValue({ imagen: file.name });
    }
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.newCategoriaForm.reset();
      this.imagenCategoria = null;
    }
  }

  async eliminarCategoria(categoria: Categoria) {
    if (!categoria || !categoria.id) {
      console.error('La categoría o su ID es null o undefined.');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que quieres eliminar la categoría "${categoria.nombre}"? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Eliminando...',
            });
            await loading.present();

            try {
              await this.firestoreService.deleteCategoria(categoria);
              this.categorias = this.categorias.filter(c => c.id !== categoria.id);
              console.log(`Categoría eliminada: ${categoria.id}`);
              this.loadCategorias();
            } catch (error) {
              console.error('Error eliminando la categoría:', error);
            } finally {
              await loading.dismiss();
              this.changeDetectorRef.detectChanges();
            }
          },
        },
      ],
    });

    await alert.present();
  }
}
