package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.FooterItem;

import java.util.List;

@Repository
public interface FooterItemRepository extends JpaRepository<FooterItem, Long> {

    @Query("SELECT fi FROM FooterItem fi WHERE fi.column.id = :columnId AND fi.isActive = true ORDER BY fi.itemOrder ASC")
    List<FooterItem> findActiveItemsByColumnId(@Param("columnId") Long columnId);

    @Query("SELECT fi FROM FooterItem fi WHERE fi.column.id = :columnId ORDER BY fi.itemOrder ASC")
    List<FooterItem> findByColumnIdOrderByItemOrder(@Param("columnId") Long columnId);
}
